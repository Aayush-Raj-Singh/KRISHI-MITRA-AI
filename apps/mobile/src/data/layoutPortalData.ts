import type { ImageSourcePropType } from "react-native";

export interface PortalBadge {
  name: string;
  url: string;
  logoSource: ImageSourcePropType;
}

export const HEADER_BADGES: PortalBadge[] = [
  {
    name: "Azadi Ka Amrit Mahotsav",
    url: "https://amritmahotsav.nic.in/",
    logoSource: require("../../assets/portals/azadi-ka-amrit-mahotsav.png"),
  },
  {
    name: "G20 India",
    url: "https://www.g20.org/en/",
    logoSource: require("../../assets/portals/g20.png"),
  },
  {
    name: "Digital India",
    url: "https://www.digitalindia.gov.in/",
    logoSource: require("../../assets/portals/digital-india.png"),
  },
];

export const EXTERNAL_PORTALS: PortalBadge[] = [
  {
    name: "Data Gov",
    url: "https://www.digitalindia.gov.in/",
    logoSource: require("../../assets/portals/data-gov.png"),
  },
  {
    name: "Digital India",
    url: "https://www.digitalindia.gov.in/",
    logoSource: require("../../assets/portals/digital-india.png"),
  },
  {
    name: "India Gov",
    url: "https://www.india.gov.in/",
    logoSource: require("../../assets/portals/india-gov.png"),
  },
  {
    name: "Make In India",
    url: "https://www.makeinindia.com/",
    logoSource: require("../../assets/portals/make-in-india.png"),
  },
  {
    name: "MyGov",
    url: "https://www.mygov.in/",
    logoSource: require("../../assets/portals/mygov.png"),
  },
  {
    name: "Public Grievances",
    url: "https://pgportal.gov.in/",
    logoSource: require("../../assets/portals/public-grievances.png"),
  },
];
