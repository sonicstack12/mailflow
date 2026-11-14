import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { User, Profile, UserRole } from "../db/models.js";
import { signAccessToken } from "../auth/jwt.js";

export class AuthService {
  static async signup(body: any) {
    const existing = await User.findOne({ email: body.email }).lean();
    if (existing) throw new Error("Email already exists");

    const userId = uuidv4();
    const hash = await bcrypt.hash(body.password, 12);

    await User.create({
      _id: userId,
      email: body.email,
      password_hash: hash,
      full_name: body.fullName,
    });

    await Profile.create({
      _id: uuidv4(),
      user_id: userId,
      subscription_tier: "free",
      last_email_reset_date: new Date(),
    });

    await UserRole.create({
      _id: uuidv4(),
      user_id: userId,
      role: "user",
    });

    return signAccessToken({ userId, email: body.email, roles: ["user"] });
  }

  static async login(body: any) {
    const user = await User.findOne({ email: body.email }).lean();
    if (!user) throw new Error("Invalid credentials");

    const ok = await bcrypt.compare(body.password, user.password_hash);
    if (!ok) throw new Error("Invalid credentials");

    const roleDocs = await UserRole.find({ user_id: user._id }).lean();
    const roles = roleDocs.map((r) => r.role as "admin" | "moderator" | "user");
    if (roles.length === 0) roles.push("user");

    return signAccessToken({ userId: user._id, email: user.email, roles });
  }

  static async getMe(userId: string, authRoles: string[]) {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error("Unauthorized");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const profile = await Profile.findOne({ user_id: userId });
    
    if (profile) {
      const lastReset = new Date(profile.last_email_reset_date);
      lastReset.setHours(0, 0, 0, 0);
      if (lastReset < today) {
        profile.daily_email_count = 0;
        profile.last_email_reset_date = today;
        await profile.save();
      }
    }

    const profileDoc = await Profile.findOne({ user_id: userId }).lean();

    return {
      user: { id: user._id, email: user.email, full_name: user.full_name, roles: authRoles },
      profile: profileDoc
        ? {
            user_id: profileDoc.user_id,
            subscription_tier: profileDoc.subscription_tier,
            subscription_expires_at: profileDoc.subscription_expires_at?.toISOString() || null,
            daily_email_count: profileDoc.daily_email_count,
            last_email_reset_date: profileDoc.last_email_reset_date.toISOString().split("T")[0],
          }
        : null,
    };
  }

  static async changePassword(userId: string, body: any) {
    const user = await User.findById(userId);
    if (!user) throw new Error("Unauthorized");

    const ok = await bcrypt.compare(body.currentPassword, user.password_hash);
    if (!ok) throw new Error("Current password is incorrect");

    const newHash = await bcrypt.hash(body.newPassword, 12);
    user.password_hash = newHash;
    await user.save();
  }
}
