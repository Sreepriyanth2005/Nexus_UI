export interface CreateSubmitIdeaPayload {
  ideaTitle: string;
  tellUsMore: string;
  categoryId: string;
  contactMe?: boolean;
}

export interface SubmitIdeaResponseItem {
  id: string;
  userId: string;
  ideaTitle: string;
  tellUsMore: string;
  categoryId: string;
  contactMe: boolean;
  createdAt: string;
}

export interface CreateIssueReportPayload {
  issueType: string;
  courseAffected?: string;
  issueDescribe: string;
  screenshotAssetId?: string;
  includeInfo?: boolean;
}

export interface IssueReportResponseItem {
  id: string;
  userId: string;
  issueType: string;
  courseAffected?: string;
  issueDescribe: string;
  screenshotAssetId?: string;
  includeInfo: boolean;
  createdAt: string;
}
