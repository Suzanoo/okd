export const siteConfig = {
  hero: {
    eyebrow: "No Action, Talk Only",
    title: "Que´ Sera, Sera 🙉 🙈 🙊",
    description:
      "",
    image: "/images/Couple_sheltering4.png",
    primaryAction: {
      label: "View latest progress",
      href: "#progress",
    },
    secondaryAction: {
      label: "Stakeholder login",
      href: "/report",
    },
  },

  overview: {
    eyebrow: "Overview",
    title: "OKd in a nutshell",
    description:
      "River flows in you, and I flow in you. The project is a metaphor for the journey of life, where we navigate through challenges and embrace the beauty of the unknown.",
    image: "/images/Couple-standing_apart3.png",
    facts: [
      { label: "Owner", value: "OKd" },
      { label: "Location", value: "Bangkok, Thailand" },
      { label: "System", value: "Law of Wild Life" },
      { label: "Stage", value: "V1" },
    ],
  },

  progress: {
    eyebrow: "Status",
    title: "No Money, No Honey",
    description:
      "",
    image: "/images/Montmartre_stairway.png",
    overall: 72,
    plan: 75,
    actual: 72,
    status: "On Track",
    updatedAt: "Latest weekly update",
  },

  timelapse: {
    eyebrow: "Latest time",
    title: "Visual progress records",
    description:
      "",
    image: "/images/Tourist.png",
    href: "/media",
    buttonLabel: "Open media records",
  },

  news: {
    eyebrow: "Latest news",
    title: "Project updates",
    items: [
      {
        title: "Weekly progress update",
        date: "Week update",
        description: "Next steps",
        image: "/images/Arc_de_Triomphe.png",
      },
      {
        title: "Site coordination",
        date: "Coordination",
        description: "Next steps",
        image: "/images/silhouette_of_cyclist.png",
      },
      {
        title: "Documents management",
        date: "Records",
        description: "Next steps",
        image: "/images/Yolyn_Am_Canyon.png",
      },
    ],
  },
} as const;
