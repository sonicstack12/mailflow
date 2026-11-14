import { useEffect } from 'react';

interface OrganizationData {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}

interface SoftwareApplicationData {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

interface StructuredDataProps {
  organization?: OrganizationData;
  softwareApplication?: SoftwareApplicationData;
}

const StructuredData = ({ organization, softwareApplication }: StructuredDataProps) => {
  useEffect(() => {
    const scripts: HTMLScriptElement[] = [];

    if (organization) {
      const orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: organization.name,
        url: organization.url,
        logo: organization.logo,
        description: organization.description,
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(orgSchema);
      document.head.appendChild(script);
      scripts.push(script);
    }

    if (softwareApplication) {
      const appSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: softwareApplication.name,
        description: softwareApplication.description,
        applicationCategory: softwareApplication.applicationCategory,
        operatingSystem: softwareApplication.operatingSystem,
        offers: softwareApplication.offers
          ? {
              '@type': 'Offer',
              price: softwareApplication.offers.price,
              priceCurrency: softwareApplication.offers.priceCurrency,
            }
          : undefined,
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(appSchema);
      document.head.appendChild(script);
      scripts.push(script);
    }

    return () => {
      scripts.forEach((script) => script.remove());
    };
  }, [organization, softwareApplication]);

  return null;
};

export default StructuredData;
