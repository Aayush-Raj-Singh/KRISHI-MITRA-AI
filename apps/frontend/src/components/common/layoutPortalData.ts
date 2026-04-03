export interface PortalBadge {
  name: string;
  url: string;
  logoSrc?: string;
  imageSrc?: string;
  caption?: string;
  verified?: boolean;
}

const TRUSTED_PORTAL_DOMAINS = [
  "agmarknet.gov.in",
  "amritmahotsav.nic.in",
  "data.gov.in",
  "digitalindia.gov.in",
  "enam.gov.in",
  "farmer.gov.in",
  "g20.org",
  "india.gov.in",
  "mkisan.gov.in",
  "mygov.in",
  "pgportal.gov.in",
  "pmfby.gov.in",
  "pmkisan.gov.in",
  "soilhealth.dac.gov.in",
] as const;

export const isTrustedPortalUrl = (url: string) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TRUSTED_PORTAL_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

export const EXTERNAL_PORTALS: PortalBadge[] = [
  {
    name: "Data Gov",
    url: "https://data.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/datagov.png",
    imageSrc: "/assets/agri-gallery/agri-001.jpg",
    caption: "Open datasets",
    verified: true,
  },
  {
    name: "Digital India",
    url: "https://www.digitalindia.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/degitalindia.png",
    imageSrc: "/assets/agri-gallery/agri-008.jpg",
    caption: "Digital services",
    verified: true,
  },
  {
    name: "India Gov",
    url: "https://www.india.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/indiagov.png",
    imageSrc: "/assets/agri-gallery/agri-010.jpg",
    caption: "Citizen portal",
    verified: true,
  },
  {
    name: "PM-KISAN",
    url: "https://pmkisan.gov.in/",
    imageSrc: "/assets/agri-gallery/agri-012.jpg",
    caption: "Scheme status",
    verified: true,
  },
  {
    name: "eNAM",
    url: "https://enam.gov.in/web/",
    imageSrc: "/assets/agri-gallery/agri-014.jpg",
    caption: "National market",
    verified: true,
  },
  {
    name: "Agmarknet",
    url: "https://agmarknet.gov.in/",
    imageSrc: "/assets/agri-gallery/agri-015.jpg",
    caption: "Mandi prices",
    verified: true,
  },
  {
    name: "mKisan",
    url: "https://mkisan.gov.in/",
    imageSrc: "/assets/agri-gallery/agri-017.jpg",
    caption: "Farmer alerts",
    verified: true,
  },
  {
    name: "Soil Health",
    url: "https://soilhealth.dac.gov.in/",
    imageSrc: "/assets/agri-gallery/agri-019.jpg",
    caption: "Soil cards",
    verified: true,
  },
  {
    name: "Farmer Portal",
    url: "https://farmer.gov.in/",
    imageSrc: "/assets/agri-gallery/agri-021.jpg",
    caption: "Registrations",
    verified: true,
  },
  {
    name: "PMFBY",
    url: "https://pmfby.gov.in/",
    imageSrc: "/assets/agri-gallery/agri-022.jpg",
    caption: "Crop insurance",
    verified: true,
  },
  {
    name: "MyGov",
    url: "https://www.mygov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/mygov.png",
    imageSrc: "/assets/agri-gallery/agri-024.jpg",
    caption: "Public participation",
    verified: true,
  },
  {
    name: "Public Grievances",
    url: "https://pgportal.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/public.png",
    imageSrc: "/assets/agri-gallery/agri-026.jpg",
    caption: "Support desk",
    verified: true,
  },
];

export const HEADER_BADGES: PortalBadge[] = [
  {
    name: "Azadi Ka Amrit Mahotsav",
    url: "https://amritmahotsav.nic.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/azadi-ka-amrit-mahotsav.png",
    verified: true,
  },
  {
    name: "G20 India",
    url: "https://www.g20.org/en/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/g20.png",
    verified: true,
  },
  {
    name: "Digital India",
    url: "https://www.digitalindia.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/degitalindia.png",
    verified: true,
  },
];

export const TRUSTED_EXTERNAL_PORTALS = EXTERNAL_PORTALS.filter(
  (portal) => Boolean(portal.verified) && isTrustedPortalUrl(portal.url),
);

export const TRUSTED_HEADER_BADGES = HEADER_BADGES.filter(
  (portal) => Boolean(portal.verified) && isTrustedPortalUrl(portal.url),
);
