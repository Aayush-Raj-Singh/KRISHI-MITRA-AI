export interface PortalBadge {
  name: string;
  url: string;
  logoSrc: string;
  verified?: boolean;
}

export const EXTERNAL_PORTALS: PortalBadge[] = [
  {
    name: "Data Gov",
    url: "https://www.digitalindia.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/datagov.png",
    verified: true
  },
  {
    name: "Digital India",
    url: "https://www.digitalindia.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/degitalindia.png",
    verified: true
  },
  {
    name: "India Gov",
    url: "https://www.india.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/indiagov.png",
    verified: true
  },
  {
    name: "Make In India",
    url: "https://www.makeinindia.com/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/makeinindia.png",
    verified: true
  },
  {
    name: "MyGov",
    url: "https://www.mygov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/mygov.png",
    verified: true
  },
  {
    name: "Public Grievances",
    url: "https://pgportal.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/public.png",
    verified: true
  }
];

export const HEADER_BADGES: PortalBadge[] = [
  {
    name: "Azadi Ka Amrit Mahotsav",
    url: "https://amritmahotsav.nic.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/azadi-ka-amrit-mahotsav.png",
    verified: true
  },
  {
    name: "G20 India",
    url: "https://www.g20.org/en/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/g20.png",
    verified: true
  },
  {
    name: "Digital India",
    url: "https://www.digitalindia.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/degitalindia.png",
    verified: true
  }
];
