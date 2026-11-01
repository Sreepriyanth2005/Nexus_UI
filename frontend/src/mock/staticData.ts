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
          {
            id: "quiz-pre-crs-ai-101",
            title: "Pre-Course Diagnostic Assessment: Commercial Cleaning Baseline",
            duration: 10,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "PRE_ASSESSMENT",
            completed: false
          },
          { id: "les-101", title: "Proper Use of Personal Protective Equipment (PPE) - Video SOP", duration: 25, type: "VIDEO", lessonType: "VIDEO", completed: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
          { id: "les-102", title: "Color-Coded Cleaning Cloth & Chemical Dilution Manual (PDF)", duration: 30, type: "PDF", lessonType: "PDF", pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", completed: true },
          { id: "les-103", title: "Commercial Sanitization & Infection Control Deck (PPT)", duration: 20, type: "PPT", lessonType: "PPT", pptUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt", fileUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt", completed: true },
          { id: "les-104", title: "Workstation, Keyboard & High-Touch Disinfection Protocol", duration: 35, type: "VIDEO", lessonType: "VIDEO", completed: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
          {
            id: "quiz-post-crs-ai-101",
            title: "Post-Course Certification Assessment: Commercial Sanitization Mastery",
            duration: 15,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "POST_ASSESSMENT",
            completed: false
          }
,
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
            id: "quiz-pre-crs-cloud-201",
            title: "Pre-Course Diagnostic Assessment: Office Pantry & Beverage Stations",
            duration: 10,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "PRE_ASSESSMENT",
            completed: false
          },
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
          },
          {
            id: "quiz-post-crs-cloud-201",
            title: "Post-Course Certification Assessment: Pantry Hygiene & Espresso Care",
            duration: 15,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "POST_ASSESSMENT",
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
        title: "Module 1: Safe Food Handling & Kitchenette Hygiene",
        order: 1,
        lessons: [
          {
            id: "quiz-pre-crs-lead-301",
            title: "Pre-Course Diagnostic Assessment: Kitchenette Food Safety Baseline",
            duration: 10,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "PRE_ASSESSMENT",
            completed: false
          },
          {
            id: "les-301",
            title: "Safe Food Handling & Hand Hygiene Standards (Video)",
            duration: 25,
            type: "VIDEO",
            lessonType: "VIDEO",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            completed: true
          },
          {
            id: "les-302",
            title: "Kitchenette Food Safety & Cross-Contamination SOP Manual (PDF)",
            duration: 30,
            type: "PDF",
            lessonType: "PDF",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            completed: true
          },
          {
            id: "les-303",
            title: "Refrigerator Temperature & Food Allergy Prevention Training Deck (PPT)",
            duration: 25,
            type: "PPT",
            lessonType: "PPT",
            pptUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            fileUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            completed: false
          },
          {
            id: "les-304",
            title: "Shared Kitchenette Disinfection & Microwave Sanitization (Video)",
            duration: 20,
            type: "VIDEO",
            lessonType: "VIDEO",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            completed: false
          },
          {
            id: "quiz-post-crs-lead-301",
            title: "Post-Course Certification Assessment: Food Safety & Cross-Contamination",
            duration: 15,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "POST_ASSESSMENT",
            completed: false
          }

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
            id: "quiz-pre-crs-data-401",
            title: "Pre-Course Diagnostic Assessment: Industrial Floor Care Baseline",
            duration: 10,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "PRE_ASSESSMENT",
            completed: false
          },
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
          },
          {
            id: "quiz-post-crs-data-401",
            title: "Post-Course Certification Assessment: Rotary Machine & Floor Mastery",
            duration: 15,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "POST_ASSESSMENT",
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
        title: "Module 1: Workplace Waste Segregation & Green Standards",
        order: 1,
        lessons: [
          {
            id: "quiz-pre-crs-compliance-501",
            title: "Pre-Course Diagnostic Assessment: Waste Management & Segregation",
            duration: 10,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "PRE_ASSESSMENT",
            completed: false
          },
          {
            id: "les-501",
            title: "Dry vs. Wet Waste Segregation in Office Cafeterias (Video)",
            duration: 30,
            type: "VIDEO",
            lessonType: "VIDEO",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
            completed: true
          },
          {
            id: "les-502",
            title: "Corporate Waste Disposal & Green Cleaning Compliance Guide (PDF)",
            duration: 25,
            type: "PDF",
            lessonType: "PDF",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            completed: true
          },
          {
            id: "les-503",
            title: "Office Recycling Standards & Zero-Waste Sustainability Deck (PPT)",
            duration: 25,
            type: "PPT",
            lessonType: "PPT",
            pptUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            fileUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            completed: false
          },
          {
            id: "les-504",
            title: "Safe Disposal of Broken Glassware & Sharps Protocol (Video)",
            duration: 20,
            type: "VIDEO",
            lessonType: "VIDEO",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
            completed: false
          },
          {
            id: "quiz-post-crs-compliance-501",
            title: "Post-Course Certification Assessment: Green Cleaning & Waste Compliance",
            duration: 15,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "POST_ASSESSMENT",
            completed: false
          }

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
        title: "Module 1: Executive Boardroom Setup & VIP Etiquette",
        order: 1,
        lessons: [
          {
            id: "quiz-pre-crs-draft-601",
            title: "Pre-Course Diagnostic Assessment: VIP Boardroom Hospitality Baseline",
            duration: 10,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "PRE_ASSESSMENT",
            completed: false
          },
          {
            id: "les-601",
            title: "VIP Beverage Service Etiquette & Table Arrangement (Video)",
            duration: 35,
            type: "VIDEO",
            lessonType: "VIDEO",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            completed: false
          },
          {
            id: "les-602",
            title: "Executive Meeting Hospitality & Protocol SOP Manual (PDF)",
            duration: 25,
            type: "PDF",
            lessonType: "PDF",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            completed: false
          },
          {
            id: "les-603",
            title: "Boardroom Service Standards & VIP Setup Slides (PPT)",
            duration: 25,
            type: "PPT",
            lessonType: "PPT",
            pptUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            fileUrl: "https://file-examples.com/storage/fe55523a1e6490db0285a73/2017/08/file_example_PPT_250kB.ppt",
            completed: false
          },
          {
            id: "les-604",
            title: "Post-Meeting Turnover & Rapid Sanitization (Video)",
            duration: 20,
            type: "VIDEO",
            lessonType: "VIDEO",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
            completed: false
          },
          {
            id: "quiz-post-crs-draft-601",
            title: "Post-Course Certification Assessment: Executive Boardroom & VIP Service",
            duration: 15,
            type: "QUIZ",
            lessonType: "QUIZ",
            quizType: "POST_ASSESSMENT",
            completed: false
          }

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
    id: "cert-crs-ai-101",
    courseId: "crs-ai-101",
    serialNumber: "NX-2026-CLN-883419",
    courseTitle: "Commercial Office Cleaning & Sanitization Standards",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-02-15T10:00:00Z",
    expiryDate: "2029-02-15T10:00:00Z",
    credentialUrl: "https://nexusacademy.org/verify/NX-2026-CLN-883419",
    status: "ACTIVE",
    grade: "98%",
    issuer: "Nexus Operational Standards Institute",
    user: {
      id: "usr-1",
      email: "member@nexus.org",
      profile: {
        firstName: "Alex",
        lastName: "Johnson",
        certificateName: "Alex Johnson",
        titlePrefix: null
      }
    },
    course: {
      id: "crs-ai-101",
      title: "Commercial Office Cleaning & Sanitization Standards",
      careerPaths: []
    },
    verification: {
      isRevoked: false,
      revokedAt: null,
      publicUrl: "/verify/NX-2026-CLN-883419",
      verificationToken: "tok-ai-101"
    },
    logs: []
  },
  {
    id: "cert-crs-cloud-201",
    courseId: "crs-cloud-201",
    serialNumber: "NX-2026-PAN-492104",
    courseTitle: "Office Pantry Room Operations & Beverage Station Care",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-01-20T14:30:00Z",
    expiryDate: "2027-01-20T14:30:00Z",
    credentialUrl: "https://nexusacademy.org/verify/NX-2026-PAN-492104",
    status: "ACTIVE",
    grade: "100%",
    issuer: "Nexus Operational Standards Institute",
    user: {
      id: "usr-1",
      email: "member@nexus.org",
      profile: {
        firstName: "Alex",
        lastName: "Johnson",
        certificateName: "Alex Johnson",
        titlePrefix: null
      }
    },
    course: {
      id: "crs-cloud-201",
      title: "Office Pantry Room Operations & Beverage Station Care",
      careerPaths: []
    },
    verification: {
      isRevoked: false,
      revokedAt: null,
      publicUrl: "/verify/NX-2026-PAN-492104",
      verificationToken: "tok-cloud-201"
    },
    logs: []
  },
  {
    id: "cert-crs-lead-301",
    courseId: "crs-lead-301",
    serialNumber: "NX-2026-KIT-381920",
    courseTitle: "Commercial Kitchenette Deep Cleaning & Food Hygiene Protocols",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-02-01T09:15:00Z",
    expiryDate: "2029-02-01T09:15:00Z",
    credentialUrl: "https://nexusacademy.org/verify/NX-2026-KIT-381920",
    status: "ACTIVE",
    grade: "95%",
    issuer: "Nexus Operational Standards Institute",
    user: {
      id: "usr-1",
      email: "member@nexus.org",
      profile: {
        firstName: "Alex",
        lastName: "Johnson",
        certificateName: "Alex Johnson",
        titlePrefix: null
      }
    },
    course: {
      id: "crs-lead-301",
      title: "Commercial Kitchenette Deep Cleaning & Food Hygiene Protocols",
      careerPaths: []
    },
    verification: {
      isRevoked: false,
      revokedAt: null,
      publicUrl: "/verify/NX-2026-KIT-381920",
      verificationToken: "tok-lead-301"
    },
    logs: []
  },
  {
    id: "cert-crs-data-401",
    courseId: "crs-data-401",
    serialNumber: "NX-2026-FLR-772910",
    courseTitle: "Heavy-Duty Floor Scrubbing & Rotary Machine Mastery",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-02-10T16:00:00Z",
    expiryDate: "2029-02-10T16:00:00Z",
    credentialUrl: "https://nexusacademy.org/verify/NX-2026-FLR-772910",
    status: "ACTIVE",
    grade: "97%",
    issuer: "Nexus Operational Standards Institute",
    user: {
      id: "usr-1",
      email: "member@nexus.org",
      profile: {
        firstName: "Alex",
        lastName: "Johnson",
        certificateName: "Alex Johnson",
        titlePrefix: null
      }
    },
    course: {
      id: "crs-data-401",
      title: "Heavy-Duty Floor Scrubbing & Rotary Machine Mastery",
      careerPaths: []
    },
    verification: {
      isRevoked: false,
      revokedAt: null,
      publicUrl: "/verify/NX-2026-FLR-772910",
      verificationToken: "tok-data-401"
    },
    logs: []
  },
  {
    id: "cert-crs-compliance-501",
    courseId: "crs-compliance-501",
    serialNumber: "NX-2026-WST-551029",
    courseTitle: "Corporate Waste Segregation & Biohazard Spill Response",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-02-18T11:20:00Z",
    expiryDate: "2029-02-18T11:20:00Z",
    credentialUrl: "https://nexusacademy.org/verify/NX-2026-WST-551029",
    status: "ACTIVE",
    grade: "99%",
    issuer: "Nexus Operational Standards Institute",
    user: {
      id: "usr-1",
      email: "member@nexus.org",
      profile: {
        firstName: "Alex",
        lastName: "Johnson",
        certificateName: "Alex Johnson",
        titlePrefix: null
      }
    },
    course: {
      id: "crs-compliance-501",
      title: "Corporate Waste Segregation & Biohazard Spill Response",
      careerPaths: []
    },
    verification: {
      isRevoked: false,
      revokedAt: null,
      publicUrl: "/verify/NX-2026-WST-551029",
      verificationToken: "tok-compliance-501"
    },
    logs: []
  },
  {
    id: "cert-crs-draft-601",
    courseId: "crs-draft-601",
    serialNumber: "NX-2026-VIP-910283",
    courseTitle: "Executive Boardroom & VIP Suite Hospitality Prep",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-02-22T13:45:00Z",
    expiryDate: "2029-02-22T13:45:00Z",
    credentialUrl: "https://nexusacademy.org/verify/NX-2026-VIP-910283",
    status: "ACTIVE",
    grade: "96%",
    issuer: "Nexus Operational Standards Institute",
    user: {
      id: "usr-1",
      email: "member@nexus.org",
      profile: {
        firstName: "Alex",
        lastName: "Johnson",
        certificateName: "Alex Johnson",
        titlePrefix: null
      }
    },
    course: {
      id: "crs-draft-601",
      title: "Executive Boardroom & VIP Suite Hospitality Prep",
      careerPaths: []
    },
    verification: {
      isRevoked: false,
      revokedAt: null,
      publicUrl: "/verify/NX-2026-VIP-910283",
      verificationToken: "tok-draft-601"
    },
    logs: []
  },
  {
    id: "cert-cp-fom-01",
    careerPathId: "cp-fom-01",
    career_path_id: "cp-fom-01",
    serialNumber: "NX-2026-CP-FOM-1001",
    courseTitle: "Facility Operations Master Program",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-02-25T15:30:00Z",
    expiryDate: "2029-02-25T15:30:00Z",
    credentialUrl: "https://nexusacademy.org/verify/NX-2026-CP-FOM-1001",
    status: "ACTIVE",
    grade: "98%",
    issuer: "Nexus Operational Standards Institute",
    user: {
      id: "usr-1",
      email: "member@nexus.org",
      profile: {
        firstName: "Alex",
        lastName: "Johnson",
        certificateName: "Alex Johnson",
        titlePrefix: null
      }
    },
    career_paths: {
      id: "cp-fom-01",
      title: "Facility Operations Master Program"
    },
    verification: {
      isRevoked: false,
      revokedAt: null,
      publicUrl: "/verify/NX-2026-CP-FOM-1001",
      verificationToken: "tok-cp-fom-01"
    },
    logs: []
  },
  {
    id: "cert-cp-hsc-02",
    careerPathId: "cp-hsc-02",
    career_path_id: "cp-hsc-02",
    serialNumber: "NX-2026-CP-HSC-2002",
    courseTitle: "Health & Safety Compliance Officer Track",
    recipientName: "Alex Johnson",
    recipientEmail: "member@nexus.org",
    issuedAt: "2026-02-28T17:00:00Z",
    expiryDate: "2029-02-28T17:00:00Z",
    credentialUrl: "https://nexusacademy.org/verify/NX-2026-CP-HSC-2002",
    status: "ACTIVE",
    grade: "97%",
    issuer: "Nexus Operational Standards Institute",
    user: {
      id: "usr-1",
      email: "member@nexus.org",
      profile: {
        firstName: "Alex",
        lastName: "Johnson",
        certificateName: "Alex Johnson",
        titlePrefix: null
      }
    },
    career_paths: {
      id: "cp-hsc-02",
      title: "Health & Safety Compliance Officer Track"
    },
    verification: {
      isRevoked: false,
      revokedAt: null,
      publicUrl: "/verify/NX-2026-CP-HSC-2002",
      verificationToken: "tok-cp-hsc-02"
    },
    logs: []
  }
];

export const STATIC_QUIZZES = [
  {
    "id": "quiz-pre-crs-ai-101",
    "courseId": "crs-ai-101",
    "lessonId": "quiz-pre-crs-ai-101",
    "title": "Pre-Course Diagnostic Assessment: Commercial Cleaning Baseline",
    "quizType": "PRE_ASSESSMENT",
    "description": "Baseline diagnostic assessment evaluating prior knowledge of safety protocols, PPE, and standard operational workflows before training modules.",
    "passingScore": 70,
    "timeLimitMinutes": 10,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-ai-pre-1",
        "questionType": "MCQ",
        "questionText": "Which color-coded microfiber cloth is strictly reserved for washroom and sanitary fixtures?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Red",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Blue",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Yellow",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Green",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-ai-pre-2",
        "questionType": "MCQ",
        "questionText": "What is the primary safety purpose of wearing nitrile gloves when preparing chemical dilutions?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Prevents skin absorption and hazardous chemical burns",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Keeps hands warm in air-conditioned facilities",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Improves grip on heavy mop handles",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Standard company uniform appearance only",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-ai-pre-3",
        "questionType": "TRUE_FALSE",
        "questionText": "Spraying cleaning chemical directly into electrical computer keyboard vents is safe if using a microfiber cloth.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "False",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "True",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-ai-pre-4",
        "questionType": "MCQ",
        "questionText": "What is the recommended minimum surface dwell time for hospital-grade disinfectant spray?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "10 minutes",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "30 seconds",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "2 minutes",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Immediate wipe off",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-ai-pre-5",
        "questionType": "MCQ",
        "questionText": "Before entering an occupied conference room for sanitization, what should staff do first?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Knock firmly, announce housekeeping, and wait for confirmation",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Walk in immediately if the lights are on",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Place caution tape across the doorway without knocking",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Turn off room lights to signal room servicing",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-post-crs-ai-101",
    "courseId": "crs-ai-101",
    "lessonId": "quiz-post-crs-ai-101",
    "title": "Post-Course Certification Assessment: Commercial Sanitization Mastery",
    "quizType": "POST_ASSESSMENT",
    "description": "Final comprehensive certification exam evaluating mastery of Video SOPs, PDF manuals, and PPT slide decks. Passing score: 70%.",
    "passingScore": 70,
    "timeLimitMinutes": 15,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-ai-post-1",
        "questionType": "MCQ",
        "questionText": "When diluting concentrated multi-surface cleaner, what is the mandatory sequence?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Always add water first, then add chemical concentrate to prevent splashing",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Pour concentrate first, then splash hot water from high above",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Mix concentrate with bleach for enhanced fragrance",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Sequence does not matter as long as container is shaken vigorously",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-ai-post-2",
        "questionType": "MCQ",
        "questionText": "Which cloth color is designated for general office desks, conference tables, and computer monitors?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Blue",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Red",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Yellow",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "White",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-ai-post-3",
        "questionType": "MCQ",
        "questionText": "High-touch surface sanitization protocols require door handles and light switches to be wiped in what direction?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Single unidirectional stroke without circular back-and-forth wiping",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Vigorous circular rubbing to generate heat",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Spray with dry towel and air dry",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Only top edge needs wiping",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-ai-post-4",
        "questionType": "MCQ",
        "questionText": "If a chemical spill of unknown origin occurs in an open workspace, what is the first action step?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Cordon off the area with safety cones and consult Safety Data Sheets (SDS)",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Mop up immediately with cold water without gloves",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Cover with newspaper and leave for the night shift",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Spray air freshener to neutralize chemical fumes",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-ai-post-5",
        "questionType": "TRUE_FALSE",
        "questionText": "Yellow microfiber cloths are reserved exclusively for pantry counter surfaces, sinks, and food prep areas.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "True",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "False",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-pre-crs-cloud-201",
    "courseId": "crs-cloud-201",
    "lessonId": "quiz-pre-crs-cloud-201",
    "title": "Pre-Course Diagnostic Assessment: Office Pantry & Beverage Stations",
    "quizType": "PRE_ASSESSMENT",
    "description": "Baseline diagnostic assessment evaluating knowledge of commercial espresso care, dairy temperature safety, and daily pantry hygiene.",
    "passingScore": 70,
    "timeLimitMinutes": 10,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-cloud-pre-1",
        "questionType": "MCQ",
        "questionText": "How often should automatic espresso milk frothing wands be purged and wiped down?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Immediately after each steam cycle and thoroughly at end of shift",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Once at the end of the week",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Only when milk residue turns brown",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Every 24 hours without purging",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-cloud-pre-2",
        "questionType": "MCQ",
        "questionText": "What is the maximum acceptable holding temperature for fresh dairy and plant milk in the pantry chiller?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "4°C (40°F) or below",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "10°C (50°F)",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "15°C (59°F)",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Room temperature if unopened",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-cloud-pre-3",
        "questionType": "TRUE_FALSE",
        "questionText": "Descaling chemical solution can be left in the coffee brewer boiler overnight without rinsing.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "False",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "True",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-cloud-pre-4",
        "questionType": "MCQ",
        "questionText": "Which PPE is required when backflushing commercial espresso group heads with hot chemical detergent?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Heat-resistant gloves and safety eye protection",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Standard dust mask only",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "No PPE is needed for coffee machines",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Cotton gardening gloves",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-cloud-pre-5",
        "questionType": "MCQ",
        "questionText": "What is the standard procedure if an office water filtration dispenser dispenses cloudy water?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Shut off water valve, tag out unit, and report to facilities technician",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Let it run for 10 seconds and tell staff it is normal",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Add lemon juice to clarify the water",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Ignore unless water smells sweet",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-post-crs-cloud-201",
    "courseId": "crs-cloud-201",
    "lessonId": "quiz-post-crs-cloud-201",
    "title": "Post-Course Certification Assessment: Pantry Hygiene & Espresso Care",
    "quizType": "POST_ASSESSMENT",
    "description": "Final comprehensive certification exam evaluating mastery of beverage station hygiene, machine descaling, and food-safe sanitization.",
    "passingScore": 70,
    "timeLimitMinutes": 15,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-cloud-post-1",
        "questionType": "MCQ",
        "questionText": "What is the FIFO inventory principle used for pantry milk and snack replenishment?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "First In, First Out — oldest stock placed forward for earliest consumption",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Fast Inspection, Fast Operation",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Fresh Items First Only",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Finish In Four Orders",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-cloud-post-2",
        "questionType": "MCQ",
        "questionText": "Which sanitizing agent is certified safe for direct food-contact surfaces like blenders and cutting surfaces?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "No-rinse food-contact quaternary ammonium solution at 200 ppm",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Concentrated pine solvent",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Industrial floor stripper solution",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Bleach undiluted",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-cloud-post-3",
        "questionType": "MCQ",
        "questionText": "How many fresh water flushes are mandatory after performing a chemical descale cycle on an espresso brewer?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "At least 3 full boiler capacity water flushes until test strip confirms neutrality",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "One quick 5-second rinse",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "No flushing required if descaler is citric acid based",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "10 drops of water through group head",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-cloud-post-4",
        "questionType": "TRUE_FALSE",
        "questionText": "Beverage station drip trays must be removed, washed with warm soapy water, and disinfected daily.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "True",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "False",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-cloud-post-5",
        "questionType": "MCQ",
        "questionText": "What is the correct sanitization method for ice maker scoops in corporate pantry areas?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Store in dedicated clean holster outside the ice bin; wash and sanitize daily",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Bury scoop blade directly inside the ice pile",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Wipe with restroom rag once weekly",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Rinse with tap water once a month",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-pre-crs-lead-301",
    "courseId": "crs-lead-301",
    "lessonId": "quiz-pre-crs-lead-301",
    "title": "Pre-Course Diagnostic Assessment: Kitchenette Food Safety Baseline",
    "quizType": "PRE_ASSESSMENT",
    "description": "Diagnostic baseline evaluating food hygiene principles, cross-contamination vectors, and temperature safety boundaries.",
    "passingScore": 70,
    "timeLimitMinutes": 10,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-lead-pre-1",
        "questionType": "MCQ",
        "questionText": "What temperature range is designated as the hazardous 'Food Danger Zone' where pathogens multiply rapidly?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "4°C to 60°C (40°F to 140°F)",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "0°C to 10°C (32°F to 50°F)",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "70°C to 100°C (158°F to 212°F)",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Minus 18°C to 0°C",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-lead-pre-2",
        "questionType": "MCQ",
        "questionText": "How long must standard handwashing with antimicrobial soap and warm running water last at minimum?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "At least 20 seconds of thorough friction lathering",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "5 seconds quick rinse",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "1 minute continuous scrubbing",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "3 seconds with sanitizer only",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-lead-pre-3",
        "questionType": "TRUE_FALSE",
        "questionText": "Raw produce cutting boards may be wiped with dry paper towels between uses without washing or sanitizing.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "False",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "True",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-lead-pre-4",
        "questionType": "MCQ",
        "questionText": "What is the maximum duration prepared perishable food can safely sit at room temperature in a breakroom?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "2 hours maximum (1 hour if ambient temp exceeds 32°C)",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "6 hours",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "24 hours",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Entire workday",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-lead-pre-5",
        "questionType": "MCQ",
        "questionText": "Which chemical storage rule applies to corporate kitchenette supplies?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Store cleaning chemicals in separate locked cabinet below or away from food items",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Place dish detergent on top of open cereal boxes",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Store chemical spray bottles inside the refrigerator door",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Keep all chemical bottles uncapped on the preparation counter",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-post-crs-lead-301",
    "courseId": "crs-lead-301",
    "lessonId": "quiz-post-crs-lead-301",
    "title": "Post-Course Certification Assessment: Food Safety & Cross-Contamination",
    "quizType": "POST_ASSESSMENT",
    "description": "Final certification exam assessing refrigerator audit protocols, 3-sink sanitization standards, and food safety protocols.",
    "passingScore": 70,
    "timeLimitMinutes": 15,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-lead-post-1",
        "questionType": "MCQ",
        "questionText": "What is the standard color for cutting boards dedicated to ready-to-eat foods and pastries?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "White",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Red",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Blue",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Yellow",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-lead-post-2",
        "questionType": "MCQ",
        "questionText": "What is the 3-step sequence in a standard commercial 3-compartment sink setup?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "1: Wash (detergent at 45°C), 2: Rinse (clean warm water), 3: Sanitize (approved chemical immersion)",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "1: Sanitize, 2: Wash, 3: Air dry",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "1: Bleach soak, 2: Towel dry, 3: Cold rinse",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "1: Water spray, 2: Detergent, 3: Immediate hand dry",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-lead-post-3",
        "questionType": "MCQ",
        "questionText": "How often should refrigerator temperature logs be documented in corporate hospitality logs?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Twice daily (morning opening and afternoon audit)",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Once every quarter",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Only when ice melts",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Yearly during annual facility inspection",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-lead-post-4",
        "questionType": "TRUE_FALSE",
        "questionText": "Unlabeled food items left in communal office refrigerators past Friday 5:00 PM purge schedule may be discarded per SOP.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "True",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "False",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-lead-post-5",
        "questionType": "MCQ",
        "questionText": "What protocol must be followed when deep cleaning breakroom microwave ovens?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Steam-loosen residues with lemon water solution, wipe with food-grade sanitizer, and disinfect touch keypad",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Hose interior with high-pressure water sprayer",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Use coarse steel wool on waveguide cover",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Apply bathroom acid descaler to microwave glass",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-pre-crs-data-401",
    "courseId": "crs-data-401",
    "lessonId": "quiz-pre-crs-data-401",
    "title": "Pre-Course Diagnostic Assessment: Industrial Floor Care Baseline",
    "quizType": "PRE_ASSESSMENT",
    "description": "Diagnostic baseline testing machine safety pre-checks, cable management, hazard demarcation, and pad selection.",
    "passingScore": 70,
    "timeLimitMinutes": 10,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-data-pre-1",
        "questionType": "MCQ",
        "questionText": "Before operating a single-disc rotary floor machine, what must be inspected on the power cord?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Check entire cord for cuts, cracks, exposed wiring, and ground pin integrity",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Wipe cord with wet cloth while machine is plugged in",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Check cord color to match room decor",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Tug firmly on cord from 10 feet away to test tensile strength",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-data-pre-2",
        "questionType": "MCQ",
        "questionText": "What is the primary role of yellow 'Wet Floor' caution signs during corridor maintenance?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Warn building occupants of slip/fall hazards and demarcate safe detour paths",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Store unused floor mop heads upright",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Reserve parking spots for facility vehicles",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Keep rotary buffer handles stabilized",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-data-pre-3",
        "questionType": "TRUE_FALSE",
        "questionText": "It is acceptable to release the handle of an active rotary machine to let it spin freely on the floor.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "False",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "True",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-data-pre-4",
        "questionType": "MCQ",
        "questionText": "Which floor pad color is designed for ultra-high gloss buffing without stripping floor finish?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "White polishing pad",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Black heavy stripping pad",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Brown coarse scrubbing pad",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Green deep scrubbing pad",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-data-pre-5",
        "questionType": "MCQ",
        "questionText": "What mandatory footwear is required when operating wet floor scrubbing and stripping machinery?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Certified slip-resistant, closed-toe safety footwear with high-traction soles",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Standard running sneakers with smooth soles",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Open-heel clogs or sandals",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Canvas slip-ons",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-post-crs-data-401",
    "courseId": "crs-data-401",
    "lessonId": "quiz-post-crs-data-401",
    "title": "Post-Course Certification Assessment: Rotary Machine & Floor Mastery",
    "quizType": "POST_ASSESSMENT",
    "description": "Final certification exam evaluating VCT stripping chemistry, carpet spot neutralization, and burnisher operation.",
    "passingScore": 70,
    "timeLimitMinutes": 15,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-data-post-1",
        "questionType": "MCQ",
        "questionText": "Which pad color is universally designated for heavy-duty chemical floor stripping of wax finishes?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Black stripping pad",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Red buffing pad",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "White polishing pad",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Blue spray cleaning pad",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-data-post-2",
        "questionType": "MCQ",
        "questionText": "What RPM speed is standard for low-speed single-disc rotary scrubbers used for scrubbing and stripping?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "150 – 175 RPM",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "1500 – 2000 RPM",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "50 RPM",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "3000 RPM",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-data-post-3",
        "questionType": "MCQ",
        "questionText": "When treating stubborn coffee or tannin stains on commercial modular carpet tiles, what is the correct technique?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Blot firmly with microfiber towel from outer perimeter inward toward the center",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Scrub aggressively back and forth outward to spread the fluid",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Pour 5 gallons of hot bleach over the tile",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Scrape carpet fibers with sharp razor blade",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-data-post-4",
        "questionType": "TRUE_FALSE",
        "questionText": "After stripping resilient floor tile, floors must be neutralized with clean water or mild neutralizer before applying new wax.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "True",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "False",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-data-post-5",
        "questionType": "MCQ",
        "questionText": "How many thin, even coats of floor finish sealer should typically be applied to high-traffic commercial corridors?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "3 to 5 thin coats, allowing full 30-45 minute drying between coats",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "1 thick puddle coat left overnight",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "15 ultra-heavy coats applied continuously without drying",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "No finish is required after stripping",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-pre-crs-compliance-501",
    "courseId": "crs-compliance-501",
    "lessonId": "quiz-pre-crs-compliance-501",
    "title": "Pre-Course Diagnostic Assessment: Waste Management & Segregation",
    "quizType": "PRE_ASSESSMENT",
    "description": "Diagnostic baseline testing waste category separation, green cleaning protocols, and biohazard identification.",
    "passingScore": 70,
    "timeLimitMinutes": 10,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-comp-pre-1",
        "questionType": "MCQ",
        "questionText": "Which waste bin color is universally recognized for clean paper and cardboard recycling streams?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Blue bin",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Red biohazard bin",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Black general waste bin",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Yellow clinical bin",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-comp-pre-2",
        "questionType": "TRUE_FALSE",
        "questionText": "Spent alkaline batteries and fluorescent tubes can be thrown directly into general landfill bins.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "False",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "True",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-comp-pre-3",
        "questionType": "MCQ",
        "questionText": "What does the term 'Green Cleaning' primarily signify in facility management operations?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Practices that protect occupant health and environment using certified non-toxic chemicals",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Cleaning only surfaces that are painted green",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Cleaning outdoor lawn foliage exclusively",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Using green food coloring in cleaning water",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-comp-pre-4",
        "questionType": "MCQ",
        "questionText": "If broken glass is discovered inside an office desk wastebasket, what is the safe removal procedure?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Carefully place glass into rigid puncture-resistant sharps container and label clearly",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Compress bag with bare hands to reduce volume",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Shake wastebasket upside down over the hallway carpet",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Leave glass for desk owner to remove",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-comp-pre-5",
        "questionType": "MCQ",
        "questionText": "What is the primary operational objective of source segregation in modern LEED-certified buildings?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Divert recyclables and compostables from landfills to maximize resource recovery",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Increase weight of general garbage dumpster",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Require twice as many waste truck pickups",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Comply with decorative aesthetics only",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-post-crs-compliance-501",
    "courseId": "crs-compliance-501",
    "lessonId": "quiz-post-crs-compliance-501",
    "title": "Post-Course Certification Assessment: Green Cleaning & Waste Compliance",
    "quizType": "POST_ASSESSMENT",
    "description": "Certification exam verifying hazardous waste containment, eco-label certifications, and dumpster safety.",
    "passingScore": 70,
    "timeLimitMinutes": 15,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-comp-post-1",
        "questionType": "MCQ",
        "questionText": "How must blood-borne pathogen incidents or medical sharps be contained per OSHA standards?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Placed in puncture-proof red biohazard container with universal biohazard symbol",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Wrapped in paper towels and placed in blue paper recycling bin",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Flushed down breakroom sink",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Disposed in clear recycling bag",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-comp-post-2",
        "questionType": "MCQ",
        "questionText": "Which internationally recognized ecolabels verify environmental and health standards for green cleaners?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Green Seal, EcoLogo, and EU Ecolabel",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Fast Track Express sticker",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Fragrance Plus symbol",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Chemical Hazard skull",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-comp-post-3",
        "questionType": "MCQ",
        "questionText": "What is the strict safety rule regarding commercial waste dumpster compactors?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Never enter compactor chamber or climb inside to clear jams without full Lockout/Tagout (LOTO)",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Stand inside chamber while compactor plate is operating",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Use long broom handle while standing on open dumpster edge",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Disable emergency stop button to speed up compaction",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-comp-post-4",
        "questionType": "TRUE_FALSE",
        "questionText": "Food-contaminated greasy pizza boxes belong in clean cardboard paper recycling bins.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "False",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "True",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-comp-post-5",
        "questionType": "MCQ",
        "questionText": "What frequency of pressure washing and biocidal treatment is required for exterior waste corral areas?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Bi-weekly scheduled deep washing with bio-enzymatic odor and pest control treatments",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Once every five years",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Only after rainstorms",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Never, corrals clean themselves naturally",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-pre-crs-draft-601",
    "courseId": "crs-draft-601",
    "lessonId": "quiz-pre-crs-draft-601",
    "title": "Pre-Course Diagnostic Assessment: VIP Boardroom Hospitality Baseline",
    "quizType": "PRE_ASSESSMENT",
    "description": "Diagnostic assessment measuring readiness for high-stakes executive suite management and discretion protocols.",
    "passingScore": 70,
    "timeLimitMinutes": 10,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-draft-pre-1",
        "questionType": "MCQ",
        "questionText": "Where should chilled glassware and premium bottled water be placed at each executive boardroom seat?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Upper right quadrant of place setting with label facing the seat",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Underneath the chair",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Directly in front of laptop keyboard trackpad",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "In the middle of the conference floor",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-draft-pre-2",
        "questionType": "MCQ",
        "questionText": "How far in advance of an executive board meeting must room turnover and AV checks be 100% completed?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "At least 30 minutes prior to scheduled start time",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "30 seconds after attendees enter",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "During the CEO opening remarks",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Timing does not matter",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-draft-pre-3",
        "questionType": "TRUE_FALSE",
        "questionText": "Housekeeping staff may photograph executive strategy whiteboards to verify room layout.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "False",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "True",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-draft-pre-4",
        "questionType": "MCQ",
        "questionText": "How should executive ergonomic leather armchairs be aligned following room servicing?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Equal distance spacing, tucked 2 inches beneath table edge, uniform height, facing straight forward",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Spun around facing room windows randomly",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Stacked in the room corner",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Reclined to maximum tilt angle",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-draft-pre-5",
        "questionType": "MCQ",
        "questionText": "What discretion rule governs confidential documents found on executive boardroom tables after a session?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Do not read, touch, or distribute; immediately secure room and inform executive facilities administrator",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Post photos on social media",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Place in communal breakroom magazine rack",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Throw into open hallway trash can",
            "isCorrect": false
          }
        ]
      }
    ]
  },
  {
    "id": "quiz-post-crs-draft-601",
    "courseId": "crs-draft-601",
    "lessonId": "quiz-post-crs-draft-601",
    "title": "Post-Course Certification Assessment: Executive Boardroom & VIP Service",
    "quizType": "POST_ASSESSMENT",
    "description": "Certification exam assessing VIP hospitality etiquette, rapid room reset, surface protection, and executive presentation care.",
    "passingScore": 70,
    "timeLimitMinutes": 15,
    "timed": true,
    "allowRetry": true,
    "maxAttempts": 3,
    "quizQuestions": [
      {
        "id": "qq-draft-post-1",
        "questionType": "MCQ",
        "questionText": "What is the benchmark turnaround timeframe for rapid boardroom turnover between consecutive executive meetings?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "10 to 15 minutes: clear dishes, sanitize surfaces, restock water, realign chairs, check climate",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "2 hours",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Next morning",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "30 seconds without wiping tables",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-draft-post-2",
        "questionType": "MCQ",
        "questionText": "What type of cleaning material is required for hand-rubbed executive mahogany and tempered glass conference tables?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Ultra-fine split microfiber cloth with pH-neutral, non-ammoniated cleaner",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Abrasive scouring pad with bleach",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Rough dry cardboard",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Chemical toilet bowl cleaner",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-draft-post-3",
        "questionType": "MCQ",
        "questionText": "When serving executive guests fresh coffee or tea in a boardroom setting, which protocol must be followed?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Approach from guest's right side, place cup gently with handle at 4 o'clock, maintain silence",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Reach across attendee's laptop screen from the front",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Slide cup across the polished table from across the room",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Shout beverage name aloud to confirm order",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-draft-post-4",
        "questionType": "TRUE_FALSE",
        "questionText": "Executive boardroom HVAC climate control should be adjusted to 20°C - 21°C (68°F - 70°F) prior to high-occupancy meetings.",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "True",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "False",
            "isCorrect": false
          }
        ]
      },
      {
        "id": "qq-draft-post-5",
        "questionType": "MCQ",
        "questionText": "What is the final verification check before locking an executive boardroom at end of daily operations?",
        "questionOptions": [
          {
            "id": "opt-1",
            "optionText": "Power down interactive displays, close window treatments to level position, verify climate eco-mode, inspect carpet",
            "isCorrect": true
          },
          {
            "id": "opt-2",
            "optionText": "Leave conference phone microphone unmuted",
            "isCorrect": false
          },
          {
            "id": "opt-3",
            "optionText": "Leave door unlocked and lights at 100%",
            "isCorrect": false
          },
          {
            "id": "opt-4",
            "optionText": "Turn thermostat to maximum heat",
            "isCorrect": false
          }
        ]
      }
    ]
  }
];
