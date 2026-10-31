export interface CreateSubmitIdeaPayload {
  ideaTitle: string;
  tellUsMore: string;
  categoryId: string;
  contactMe?: boolean;
}

export interface SubmitIdeaItem {
  id: string;
  userId: string;
  ideaTitle: string;
  tellUsMore: string;
  categoryId: string;
  contactMe: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateIssueReportPayload {
  issueType: string;
  courseAffected?: string;
  issueDescribe: string;
  screenshotAssetId?: string;
  includeInfo?: boolean;
}

export interface IssueReportItem {
  id: string;
  userId: string;
  issueType: string;
  courseAffected?: string;
  issueDescribe: string;
  screenshotAssetId?: string;
  screenshotAsset?: {
    id: string;
    fileName?: string;
    signedUrl?: string;
    fileUrl?: string;
  };
  includeInfo: boolean;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
}
