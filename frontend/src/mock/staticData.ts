// src/mock/staticData.ts
// Enterprise-grade static mock data for LMS wireframe & client demonstration

export interface StaticUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roles: string[];
  status: string;
  avatar?: string;
  tenantId?: string;
  tenantName?: string;
  department?: string;
  jobTitle?: string;
  isFirstLogin?: boolean;
  phone?: string;
  country?: string;
  createdAt: string;
}

export const STATIC_ACCOUNTS: Record<string, StaticUser> = {
  "superadmin@nexus.org": {
    id: "usr-superadmin-001",
    email: "superadmin@nexus.org",
    firstName: "Sarah",
    lastName: "Vance",
    role: "SUPER_ADMIN",
    roles: ["SUPER_ADMIN"],
    status: "ACTIVE",
    tenantId: "tnt-nexus-global",
    tenantName: "Nexus Global Academy",
    department: "Executive Leadership",
    jobTitle: "Chief Learning Officer",
    phone: "+1 (555) 019-2834",
    country: "United States",
    createdAt: "2025-01-15T08:00:00Z",
  },
  "corporateadmin@nexus.org": {
    id: "usr-corpadmin-002",
    email: "corporateadmin@nexus.org",
    firstName: "Marcus",
    lastName: "Sterling",
    role: "CORPORATE_ADMIN",
    roles: ["CORPORATE_ADMIN"],
    status: "ACTIVE",
    tenantId: "tnt-acme-corp",
    tenantName: "Acme Enterprises",
    department: "People & Talent",
    jobTitle: "VP of Talent Development",
    phone: "+1 (555) 438-9102",
    country: "United States",
    createdAt: "2025-02-10T09:30:00Z",
  },
  "member@nexus.org": {
    id: "usr-member-003",
    email: "member@nexus.org",
    firstName: "Alex",
    lastName: "Johnson",
    role: "MEMBER",
    roles: ["MEMBER"],
    status: "ACTIVE",
    tenantId: "tnt-acme-corp",
    tenantName: "Acme Enterprises",
    department: "Engineering",
    jobTitle: "Senior Cloud Engineer",
    phone: "+1 (555) 872-3491",
    country: "Canada",
    createdAt: "2025-03-01T11:15:00Z",
  },
  "corporateuser@nexus.org": {
    id: "usr-corpuser-004",
    email: "corporateuser@nexus.org",
    firstName: "Elena",
    lastName: "Rostova",
    role: "CORPORATE_USER",
    roles: ["CORPORATE_USER"],
    status: "ACTIVE",
    tenantId: "tnt-acme-corp",
    tenantName: "Acme Enterprises",
    department: "Product Operations",
    jobTitle: "Product Lead",
    phone: "+44 20 7946 0912",
    country: "United Kingdom",
    createdAt: "2025-03-12T14:20:00Z",
  },
  "developer@nexus.org": {
    id: "usr-dev-005",
    email: "developer@nexus.org",
    firstName: "Devon",
    lastName: "Cruz",
    role: "CONTENT_DEVELOPER",
    roles: ["CONTENT_DEVELOPER"],
    status: "ACTIVE",
    tenantId: "tnt-nexus-global",
    tenantName: "Nexus Global Academy",
    department: "Curriculum Design",
    jobTitle: "Lead Instructional Designer",
    phone: "+1 (555) 612-9843",
    country: "United States",
    createdAt: "2025-01-20T10:00:00Z",
  },
  "sme@nexus.org": {
    id: "usr-sme-006",
    email: "sme@nexus.org",
    firstName: "Dr. Evelyn",
    lastName: "Reed",
    role: "SME",
    roles: ["SME"],
    status: "ACTIVE",
    tenantId: "tnt-nexus-global",
    tenantName: "Nexus Global Academy",
    department: "Academic Advisory",
    jobTitle: "Senior Domain Specialist",
    phone: "+1 (555) 789-2341",
    country: "United States",
    createdAt: "2025-01-25T13:45:00Z",
  },
  "support@nexus.org": {
    id: "usr-support-007",
    email: "support@nexus.org",
    firstName: "Jordan",
    lastName: "Kaye",
    role: "SYSTEM_SUPPORT_ENGINEER",
    roles: ["SYSTEM_SUPPORT_ENGINEER"],
    status: "ACTIVE",
    tenantId: "tnt-nexus-global",
    tenantName: "Nexus Global Academy",
    department: "Platform Support",
    jobTitle: "Tier 3 Platform Engineer",
    phone: "+1 (555) 321-6549",
    country: "United States",
    createdAt: "2025-02-01T08:30:00Z",
  },
};

export const STATIC_DEFAULT_ROLE_DASHBOARDS: Record<string, string> = {
  SUPER_ADMIN: "/super-admin-dashboard",
  CORPORATE_ADMIN: "/corporate-admin-dashboard",
  ADMIN: "/corporate-admin-dashboard",
  MEMBER: "/member-dashboard",
  CORPORATE_USER: "/user-dashboard",
  CONTENT_DEVELOPER: "/content-developer-dashboard",
  SME: "/sme-dashboard",
  SYSTEM_SUPPORT_ENGINEER: "/support-dashboard",
  SYSTEM_ENGINEER: "/support-dashboard",
};

export const STATIC_COURSES = [
  {
    id: "crs-ai-101",
    courseId: "crs-ai-101",
    title: "Commercial Office Cleaning & Sanitization Standards",
    slug: "commercial-office-cleaning-sanitization",
    description: "Master professional workplace cleaning protocols, hospital-grade surface disinfection practices, and daily office sanitization procedures.",
    shortDescription: "Workplace sanitation standards, chemical safety dilution, and infection control.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    coverUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    visibility: "PUBLIC_CATALOG",
    category: { id: "cat-clean", name: "Facility Cleaning & Housekeeping" },
    categoryId: "cat-clean",
    skill: { id: "skl-clean", name: "Professional Cleaning" },
    skillId: "skl-clean",
    subject: { id: "sbj-hygiene", name: "Hygiene & Sanitation" },
    subjectId: "sbj-hygiene",
    level: "BEGINNER",
    duration: 360,
    durationFormatted: "6h 0m",
    lessonCount: 14,
    totalModules: 3,
    enrolledCount: 1420,
    completionRate: 78,
    rating: 4.9,
    reviewsCount: 312,
    progressPercentage: 65,
    lastAccessedAt: "2026-03-20T10:00:00Z",
    owner: {
      id: "usr-dev-005",
      email: "facilities@nexus.org",
      profile: { firstName: "Devon", lastName: "Cruz" },
    },
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Workplace Hygiene Standards & PPE",
        order: 1,
        lessons: [
          { id: "les-101", title: "Proper Use of Personal Protective Equipment (PPE) - Video SOP", duration: 25, type: "VIDEO", lessonType: "VIDEO", completed: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
          { id: "les-102", title: "Color-Coded Cleaning Cloth & Chemical Dilution Manual (PDF)", duration: 30, type: "PDF", lessonType: "PDF", pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", completed: true },
          { id: "les-103", title: "Commercial Sanitization & Infection Control Deck (PPT)", duration: 20, type: "PPT", lessonType: "PPT", pptUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt", fileUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt", completed: true },
          { id: "les-104", title: "Workstation, Keyboard & High-Touch Disinfection Protocol", duration: 35, type: "VIDEO", lessonType: "VIDEO", completed: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
        ]
      }
    ],
    tags: ["Cleaning", "Sanitization", "Workplace Hygiene", "Housekeeping"],
    createdAt: "2025-06-10T12:00:00Z",
    updatedAt: "2026-02-14T08:00:00Z",
  },
  {
    id: "crs-cloud-201",
    courseId: "crs-cloud-201",
    title: "Office Pantry Room Operations & Beverage Station Care",
    slug: "office-pantry-room-operations-beverage-care",
    description: "Comprehensive guide to corporate pantry management, espresso machine maintenance, beverage stock rotation, and daily kitchenette hygiene.",
    shortDescription: "Coffee machine descaling, beverage station care, and daily pantry setup.",
    thumbnailUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    coverUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    visibility: "PUBLIC_CATALOG",
    category: { id: "cat-pantry", name: "Pantry & Hospitality Management" },
    categoryId: "cat-pantry",
    skill: { id: "skl-pantry", name: "Pantry Room Operations" },
    skillId: "skl-pantry",
    subject: { id: "sbj-pantry", name: "Pantry & Cafeteria Services" },
    subjectId: "sbj-pantry",
    level: "INTERMEDIATE",
    duration: 480,
    durationFormatted: "8h 0m",
    lessonCount: 18,
    totalModules: 4,
    enrolledCount: 980,
    completionRate: 84,
    rating: 4.8,
    reviewsCount: 189,
    progressPercentage: 40,
    owner: {
      id: "usr-sme-006",
      email: "hospitality@nexus.org",
      profile: { firstName: "Dr. Evelyn", lastName: "Reed" },
    },
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Coffee & Beverage Machine Care",
        order: 1,
        lessons: [
          {
            id: "les-201",
            title: "Daily Espresso Machine Cleaning & Milk Frother Flush - Video SOP",
            duration: 30,
            type: "VIDEO",
            lessonType: "VIDEO",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            completed: true
          },
          {
            id: "les-202",
            title: "Pantry Hygiene & Machine Descaling Protocol (PDF)",
            duration: 25,
            type: "PDF",
            lessonType: "PDF",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            completed: true
          },
          {
            id: "les-203",
            title: "Corporate Beverage Station & Hospitality Slides (PPT)",
            duration: 30,
            type: "PPT",
            lessonType: "PPT",
            pptUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            fileUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            completed: false
          },
          {
            id: "les-204",
            title: "First-In First-Out (FIFO) Pantry Stocking & Inventory Guide (PDF)",
            duration: 20,
            type: "PDF",
            lessonType: "PDF",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            completed: false
          }
        ]
      }
    ],
    tags: ["Pantry Management", "Coffee Machine Care", "Hospitality", "Hygiene"],
    createdAt: "2025-07-01T10:00:00Z",
    updatedAt: "2026-01-20T14:00:00Z",
  },
  {
    id: "crs-lead-301",
    courseId: "crs-lead-301",
    title: "Food Safety, Kitchenette Hygiene & Cross-Contamination Prevention",
    slug: "food-safety-kitchenette-hygiene",
    description: "Essential food safety protocols, refrigerator temperature monitoring, allergy precautions, and sanitization for shared office kitchens.",
    shortDescription: "Food handling regulations, cross-contamination prevention, and kitchen hygiene.",
    thumbnailUrl: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80",
    coverUrl: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    visibility: "PUBLIC_CATALOG",
    category: { id: "cat-pantry", name: "Pantry & Hospitality Management" },
    categoryId: "cat-pantry",
    skill: { id: "skl-foodsafety", name: "Food Safety Standards" },
    skillId: "skl-foodsafety",
    subject: { id: "sbj-hygiene", name: "Hygiene & Sanitation" },
    subjectId: "sbj-hygiene",
    level: "INTERMEDIATE",
    duration: 240,
    durationFormatted: "4h 0m",
    lessonCount: 10,
    totalModules: 2,
    enrolledCount: 450,
    completionRate: 91,
    rating: 4.95,
    reviewsCount: 120,
    progressPercentage: 100,
    owner: {
      id: "usr-superadmin-001",
      email: "safety@nexus.org",
      profile: { firstName: "Sarah", lastName: "Vance" },
    },
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Safe Food Handling in Corporate Kitchens",
        order: 1,
        lessons: [
          { id: "les-301", title: "Hand Hygiene & Glove Use Standards", duration: 25, type: "VIDEO", completed: true },
          { id: "les-302", title: "Refrigerator Temperature Logs & Leftover Cleanout Rules", duration: 30, type: "READING", completed: true },
        ]
      }
    ],
    tags: ["Food Safety", "Sanitation", "Pantry", "HACCP"],
    createdAt: "2025-08-15T09:00:00Z",
    updatedAt: "2026-03-01T11:00:00Z",
  },
  {
    id: "crs-data-401",
    courseId: "crs-data-401",
    title: "Floor Care, Deep Cleaning & Industrial Equipment Handling",
    slug: "floor-care-deep-cleaning-equipment",
    description: "Practical training on commercial vacuuming, rotary scrubber operation, carpet stain removal, and scheduled facility deep cleaning cycles.",
    shortDescription: "Carpet steam cleaning, tile scrubbing, floor polishing, and heavy-duty care.",
    thumbnailUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
    coverUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    visibility: "PUBLIC_CATALOG",
    category: { id: "cat-clean", name: "Facility Cleaning & Housekeeping" },
    categoryId: "cat-clean",
    skill: { id: "skl-floorcare", name: "Floor & Surface Care" },
    skillId: "skl-floorcare",
    subject: { id: "sbj-facilities", name: "Facility Services" },
    subjectId: "sbj-facilities",
    level: "ADVANCED",
    duration: 420,
    durationFormatted: "7h 0m",
    lessonCount: 16,
    totalModules: 3,
    enrolledCount: 630,
    completionRate: 72,
    rating: 4.75,
    reviewsCount: 94,
    progressPercentage: 15,
    owner: {
      id: "usr-dev-005",
      email: "facilities@nexus.org",
      profile: { firstName: "Devon", lastName: "Cruz" },
    },
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Rotary Machine Operation & Video SOP",
        order: 1,
        lessons: [
          {
            id: "les-401",
            title: "Rotary Floor Machine Operation & Buffing - Video SOP",
            duration: 40,
            type: "VIDEO",
            lessonType: "VIDEO",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            completed: false
          },
          {
            id: "les-402",
            title: "Carpet Stain Identification & Spot Treatment - Video SOP",
            duration: 35,
            type: "VIDEO",
            lessonType: "VIDEO",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            completed: false
          },
          {
            id: "les-403",
            title: "Industrial Floor Machine User & Safety Guide (PDF)",
            duration: 25,
            type: "PDF",
            lessonType: "PDF",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            completed: false
          },
          {
            id: "les-404",
            title: "Rotary Buffing & Deep Scrubbing Training Slides (PPT)",
            duration: 30,
            type: "PPT",
            lessonType: "PPT",
            pptUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            fileUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            completed: false
          }
        ]
      }
    ],
    tags: ["Floor Care", "Deep Cleaning", "Equipment Safety", "Housekeeping"],
    createdAt: "2025-09-01T14:00:00Z",
    updatedAt: "2026-02-28T16:00:00Z",
  },
  {
    id: "crs-compliance-501",
    courseId: "crs-compliance-501",
    title: "Waste Management, Recycling & Eco-Friendly Green Cleaning",
    slug: "waste-management-recycling-green-cleaning",
    description: "Learn color-coded waste segregation, pantry organic disposal, hazardous chemical handling, and sustainable green cleaning practices.",
    shortDescription: "Recycling compliance, organic pantry waste disposal, and green cleaning practices.",
    thumbnailUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
    coverUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    visibility: "PUBLIC_CATALOG",
    category: { id: "cat-clean", name: "Facility Cleaning & Housekeeping" },
    categoryId: "cat-clean",
    skill: { id: "skl-waste", name: "Waste Segregation & Recycling" },
    skillId: "skl-waste",
    subject: { id: "sbj-facilities", name: "Facility Services" },
    subjectId: "sbj-facilities",
    level: "BEGINNER",
    duration: 120,
    durationFormatted: "2h 0m",
    lessonCount: 8,
    totalModules: 2,
    enrolledCount: 3400,
    completionRate: 96,
    rating: 4.88,
    reviewsCount: 810,
    progressPercentage: 100,
    owner: {
      id: "usr-corpadmin-002",
      email: "sustainability@nexus.org",
      profile: { firstName: "Marcus", lastName: "Sterling" },
    },
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Workplace Waste Segregation Standards",
        order: 1,
        lessons: [
          { id: "les-501", title: "Dry vs. Wet Waste Segregation in Office Cafeterias", duration: 30, type: "VIDEO", completed: true },
          { id: "les-502", title: "Safe Disposal of Broken Glassware & Sharp Objects", duration: 25, type: "READING", completed: true },
        ]
      }
    ],
    tags: ["Waste Segregation", "Recycling", "Eco Cleaning", "Compliance"],
    createdAt: "2025-01-05T08:00:00Z",
    updatedAt: "2026-01-10T12:00:00Z",
  },
  {
    id: "crs-draft-601",
    courseId: "crs-draft-601",
    title: "Executive Boardroom Hospitality & VIP Pantry Management",
    slug: "executive-boardroom-vip-pantry-hospitality",
    description: "Professional hospitality etiquette, boardroom beverage layout, conference refreshments presentation, and rapid room turnover techniques.",
    shortDescription: "Boardroom setup, VIP hospitality etiquette, and executive refreshments.",
    thumbnailUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    coverUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    status: "PUBLISHED",
    visibility: "PUBLIC_CATALOG",
    category: { id: "cat-pantry", name: "Pantry & Hospitality Management" },
    categoryId: "cat-pantry",
    skill: { id: "skl-pantry", name: "VIP Pantry Service" },
    skillId: "skl-pantry",
    subject: { id: "sbj-pantry", name: "Pantry & Cafeteria Services" },
    subjectId: "sbj-pantry",
    level: "ADVANCED",
    duration: 300,
    durationFormatted: "5h 0m",
    lessonCount: 6,
    totalModules: 2,
    enrolledCount: 220,
    completionRate: 88,
    rating: 4.9,
    reviewsCount: 45,
    progressPercentage: 0,
    owner: {
      id: "usr-dev-005",
      email: "hospitality@nexus.org",
      profile: { firstName: "Devon", lastName: "Cruz" },
    },
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Executive Boardroom Setup",
        order: 1,
        lessons: [
          { id: "les-601", title: "VIP Beverage Service Etiquette & Table Arrangement", duration: 35, type: "VIDEO", completed: false },
          { id: "les-602", title: "Post-Meeting Turnover & Quick Disinfection", duration: 25, type: "VIDEO", completed: false },
        ]
      }
    ],
    tags: ["VIP Service", "Boardroom Setup", "Executive Hospitality", "Pantry"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-03-10T15:00:00Z",
  }
];

export const STATIC_TENANTS = [
  {
    id: "tnt-acme-corp",
    name: "Acme Enterprises Inc.",
    code: "ACME",
    domain: "acme.com",
    status: "ACTIVE",
    subscriptionTier: "ENTERPRISE_PREMIUM",
    totalLicenses: 2500,
    assignedLicenses: 1840,
    activeLearnersCount: 1620,
    contactPerson: "Marcus Sterling",
    contactEmail: "corporateadmin@nexus.org",
    billingCycle: "ANNUAL",
    expiryDate: "2027-12-31T23:59:59Z",
    createdAt: "2024-05-10T08:00:00Z",
  },
  {
    id: "tnt-novatech",
    name: "NovaTech Global Solutions",
    code: "NOVATECH",
    domain: "novatech.io",
    status: "ACTIVE",
    subscriptionTier: "ENTERPRISE",
    totalLicenses: 1200,
    assignedLicenses: 950,
    activeLearnersCount: 880,
    contactPerson: "Claire Beauchamp",
    contactEmail: "claire@novatech.io",
    billingCycle: "ANNUAL",
    expiryDate: "2027-06-30T23:59:59Z",
    createdAt: "2024-08-20T09:30:00Z",
  },
  {
    id: "tnt-fintech-corp",
    name: "Apex Financial Partners",
    code: "APEXFIN",
    domain: "apexfin.com",
    status: "ACTIVE",
    subscriptionTier: "ENTERPRISE_PLUS",
    totalLicenses: 5000,
    assignedLicenses: 4800,
    activeLearnersCount: 4210,
    contactPerson: "Daniel Gallagher",
    contactEmail: "dan@apexfin.com",
    billingCycle: "MULTI_YEAR",
    expiryDate: "2028-09-15T23:59:59Z",
    createdAt: "2024-01-15T11:00:00Z",
  },
  {
    id: "tnt-healthplus",
    name: "HealthPlus Care Network",
    code: "HEALTHPLUS",
    domain: "healthplus.org",
    status: "ACTIVE",
    subscriptionTier: "ENTERPRISE",
    totalLicenses: 800,
    assignedLicenses: 720,
    activeLearnersCount: 650,
    contactPerson: "Dr. Rachel Kim",
    contactEmail: "rachel.kim@healthplus.org",
    billingCycle: "ANNUAL",
    expiryDate: "2027-04-01T23:59:59Z",
    createdAt: "2024-11-01T14:00:00Z",
  }
];

export const STATIC_TENANT_USERS = [
  {
    id: "usr-tu-001",
    firstName: "Marcus",
    lastName: "Sterling",
    email: "corporateadmin@nexus.org",
    role: "CORPORATE_ADMIN",
    status: "ACTIVE",
    department: "Talent & Development",
    jobTitle: "VP of People",
    tenantId: "tnt-acme-corp",
    assignedCoursesCount: 12,
    completedCoursesCount: 8,
    lastActiveAt: "2026-03-22T09:12:00Z",
  },
  {
    id: "usr-tu-002",
    firstName: "Alex",
    lastName: "Johnson",
    email: "member@nexus.org",
    role: "MEMBER",
    status: "ACTIVE",
    department: "Engineering",
    jobTitle: "Senior Cloud Engineer",
    tenantId: "tnt-acme-corp",
    assignedCoursesCount: 6,
    completedCoursesCount: 4,
    lastActiveAt: "2026-03-23T11:45:00Z",
  },
  {
    id: "usr-tu-003",
    firstName: "Elena",
    lastName: "Rostova",
    email: "corporateuser@nexus.org",
    role: "CORPORATE_USER",
    status: "ACTIVE",
    department: "Product Operations",
    jobTitle: "Product Lead",
    tenantId: "tnt-acme-corp",
    assignedCoursesCount: 8,
    completedCoursesCount: 5,
    lastActiveAt: "2026-03-21T16:30:00Z",
  },
  {
    id: "usr-tu-004",
    firstName: "Brian",
    lastName: "O'Connor",
    email: "brian.o@acme.com",
    role: "CORPORATE_USER",
    status: "ACTIVE",
    department: "Cybersecurity",
    jobTitle: "Security Analyst",
    tenantId: "tnt-acme-corp",
    assignedCoursesCount: 5,
    completedCoursesCount: 2,
    lastActiveAt: "2026-03-20T14:10:00Z",
  },
  {
    id: "usr-tu-005",
    firstName: "Jessica",
    lastName: "Taylor",
    email: "j.taylor@acme.com",
    role: "CORPORATE_USER",
    status: "ACTIVE",
    department: "Finance",
    jobTitle: "Senior Accountant",
    tenantId: "tnt-acme-corp",
    assignedCoursesCount: 4,
    completedCoursesCount: 4,
    lastActiveAt: "2026-03-19T10:05:00Z",
  }
];

export const STATIC_CAREER_PATHS = [
  {
    id: "cp-001",
    title: "Facility Sanitation & Hygiene Specialist",
    slug: "facility-sanitation-hygiene-specialist",
    description: "Comprehensive pathway covering commercial cleaning standards, disinfection protocols, and equipment operations.",
    coursesCount: 5,
    totalDuration: 1800,
    durationFormatted: "30h 0m",
    enrolledCount: 420,
    progressPercentage: 60,
    status: "PUBLISHED",
    courses: STATIC_COURSES.slice(0, 3),
  },
  {
    id: "cp-002",
    title: "Corporate Pantry & Kitchenette Operations Lead",
    slug: "corporate-pantry-kitchenette-operations-lead",
    description: "End-to-end training for corporate pantry management, food safety compliance, and VIP hospitality services.",
    coursesCount: 4,
    totalDuration: 1560,
    durationFormatted: "26h 0m",
    enrolledCount: 310,
    progressPercentage: 25,
    status: "PUBLISHED",
    courses: [STATIC_COURSES[1], STATIC_COURSES[2]],
  }
];

export const STATIC_CATEGORIES = [
  { id: "cat-clean", name: "Facility Cleaning & Housekeeping", count: 18, color: "#06B6D4" },
  { id: "cat-pantry", name: "Pantry & Hospitality Management", count: 14, color: "#10B981" },
  { id: "cat-lead", name: "Leadership & Management", count: 12, color: "#4F46E5" },
  { id: "cat-comp", name: "Compliance & Governance", count: 9, color: "#F59E0B" },
];

export const STATIC_SKILLS = [
  { id: "skl-clean", name: "Professional Cleaning", category: "Facility Cleaning & Housekeeping" },
  { id: "skl-pantry", name: "Pantry Room Operations", category: "Pantry & Hospitality Management" },
  { id: "skl-foodsafety", name: "Food Safety Standards", category: "Pantry & Hospitality Management" },
  { id: "skl-floorcare", name: "Floor & Surface Care", category: "Facility Cleaning & Housekeeping" },
  { id: "skl-waste", name: "Waste Segregation & Recycling", category: "Facility Cleaning & Housekeeping" },
];

export const STATIC_TAGS = [
  { id: "tag-1", name: "Cleaning", count: 24 },
  { id: "tag-2", name: "Pantry Operations", count: 19 },
  { id: "tag-3", name: "Hygiene", count: 15 },
  { id: "tag-4", name: "Food Safety", count: 12 },
  { id: "tag-5", name: "Sanitization", count: 8 },
];

export const STATIC_SUBJECTS = [
  { id: "sbj-hygiene", name: "Hygiene & Sanitation" },
  { id: "sbj-pantry", name: "Pantry & Cafeteria Services" },
  { id: "sbj-facilities", name: "Facility Services" },
  { id: "sbj-biz", name: "Business & Strategy" },
];

export const STATIC_INDUSTRIES = [
  { id: "ind-facility", name: "Facility Management & Services" },
  { id: "ind-hosp", name: "Hospitality & Food Services" },
  { id: "ind-corp", name: "Corporate Real Estate & Workplace" },
  { id: "ind-health", name: "Healthcare & Sanitation Services" },
];

export const STATIC_FIELDS_OF_STUDY = [
  { id: "fos-clean", name: "Commercial Cleaning & Sanitation" },
  { id: "fos-pantry", name: "Corporate Hospitality & Pantry Operations" },
  { id: "fos-safety", name: "Workplace Health, Safety & Environmental" },
];

export const STATIC_ANALYTICS = {
  totalLearners: 12450,
  activeThisWeek: 8920,
  completedCoursesMonth: 3420,
  averageCompletionRate: 82.4,
  licenseUtilization: 88.6,
  engagementTrend: [
    { day: "Mon", activeUsers: 4200, completions: 340 },
    { day: "Tue", activeUsers: 5100, completions: 420 },
    { day: "Wed", activeUsers: 5800, completions: 510 },
    { day: "Thu", activeUsers: 6200, completions: 590 },
    { day: "Fri", activeUsers: 5900, completions: 540 },
    { day: "Sat", activeUsers: 2800, completions: 210 },
    { day: "Sun", activeUsers: 3100, completions: 260 },
  ],
  categoryBreakdown: [
    { name: "Cleaning & Housekeeping", percentage: 52 },
    { name: "Pantry & Hospitality", percentage: 34 },
    { name: "Hygiene & Safety", percentage: 14 },
  ],
};

export const STATIC_REPORTS = {
  courseCompletion: [
    { courseTitle: "Commercial Office Cleaning & Sanitization Standards", enrolled: 1420, completed: 1108, rate: "78%" },
    { courseTitle: "Office Pantry Room Operations & Beverage Station Care", enrolled: 980, completed: 823, rate: "84%" },
    { courseTitle: "Food Safety, Kitchenette Hygiene & Cross-Contamination Prevention", enrolled: 450, completed: 410, rate: "91%" },
    { courseTitle: "Waste Management, Recycling & Eco-Friendly Green Cleaning", enrolled: 3400, completed: 3264, rate: "96%" },
  ],
  userActivity: [
    { name: "Alex Johnson", email: "member@nexus.org", department: "Facility Operations", hoursLearned: 38.5, certificates: 2 },
    { name: "Elena Rostova", email: "corporateuser@nexus.org", department: "Pantry Services", hoursLearned: 29.0, certificates: 1 },
    { name: "Brian O'Connor", email: "brian.o@acme.com", department: "Housekeeping", hoursLearned: 22.0, certificates: 1 },
    { name: "Jessica Taylor", email: "j.taylor@acme.com", department: "Facility Management", hoursLearned: 18.2, certificates: 1 },
  ]
};

export const STATIC_REVIEW_QUEUE = [
  {
    id: "rev-001",
    entityType: "COURSE",
    title: "Executive Boardroom Hospitality & VIP Pantry Management",
    authorName: "Devon Cruz",
    submittedAt: "2026-03-20T10:15:00Z",
    status: "PENDING",
    targetRole: "SME",
    feedbackNotes: "Please verify accuracy of boardroom setup checklists in Module 1.",
  },
  {
    id: "rev-002",
    entityType: "LESSON",
    title: "Espresso Machine Descaling & Daily Cleaning Protocol",
    authorName: "Devon Cruz",
    submittedAt: "2026-03-18T14:00:00Z",
    status: "APPROVED",
    targetRole: "SME",
    feedbackNotes: "Approved with high confidence. Great practical demonstration.",
  }
];

export const STATIC_CERTIFICATES = [
  {
    id: "cert-001",
    serialNumber: "NX-2026-CLN-883419",
    courseTitle: "Commercial Office Cleaning & Sanitization Standards",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-02-15T10:00:00Z",
    expiryDate: "2029-02-15T10:00:00Z",
    credentialUrl: "https://nexusacademy.org/verify/cert-001",
    status: "ACTIVE",
    grade: "98%",
  },
  {
    id: "cert-002",
    serialNumber: "NX-2026-PAN-492104",
    courseTitle: "Office Pantry Room Operations & Beverage Station Care",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-01-20T14:30:00Z",
    expiryDate: "2027-01-20T14:30:00Z",
    credentialUrl: "https://nexusacademy.org/verify/cert-002",
    status: "ACTIVE",
    grade: "100%",
  }
];
