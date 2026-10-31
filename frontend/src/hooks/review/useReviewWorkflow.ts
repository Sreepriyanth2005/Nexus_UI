// src/hooks/review/useReviewWorkflow.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getWorkflowApi,
  getWorkflowHistoryApi,
  getPendingWorkflowApi,
  getMyWorkflowApi,
  startWorkflowApi,
  assignWorkflowApi,
  reassignWorkflowApi,
  submitWorkflowApi,
 approveWorkflowApi,
 rejectWorkflowApi,
 resolveWorkflowApi,
  requestChangesWorkflowApi,
  publishWorkflowApi,
  unpublishWorkflowApi,
  cancelWorkflowApi,
  reopenWorkflowApi,
} from "../../core/api/review/review-workflow.api";

import type {
  SubmitReviewDto,
  ApproveReviewDto,
  RejectReviewDto,
  RequestChangesDto,
  PublishReviewDto,
} from "../../types/review.types";


export const reviewWorkflowKeys = {
  all: ["review-workflow"] as const,
  list: () => [...reviewWorkflowKeys.all, "list"] as const,
  pending: () => [...reviewWorkflowKeys.all, "pending"] as const,
  my: () => [...reviewWorkflowKeys.all, "my"] as const,
  history: (reviewId: string) =>
    [...reviewWorkflowKeys.all, "history", reviewId] as const,
};


export const useWorkflow = () =>
  useQuery({
    queryKey: reviewWorkflowKeys.list(),
    queryFn: getWorkflowApi,
  });

export const usePendingWorkflow = () =>
  useQuery({
    queryKey: reviewWorkflowKeys.pending(),
    queryFn: getPendingWorkflowApi,
  });

export const useMyWorkflow = () =>
  useQuery({
    queryKey: reviewWorkflowKeys.my(),
    queryFn: getMyWorkflowApi,
  });

export const useWorkflowHistory = (reviewId: string) =>
  useQuery({
    queryKey: reviewWorkflowKeys.history(reviewId),
    queryFn: () => getWorkflowHistoryApi(reviewId),
    enabled: !!reviewId,
  });


  export const useStartWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: startWorkflowApi,
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};


export const useAssignWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      reviewerId,
    }: {
      reviewId: string;
      reviewerId: string;
    }) => assignWorkflowApi(reviewId, reviewerId),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};

export const useReassignWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      reviewerId,
    }: {
      reviewId: string;
      reviewerId: string;
    }) => reassignWorkflowApi(reviewId, reviewerId),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};


export const useSubmitWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      remarks,
    }: {
      reviewId: string;
      remarks?: string;
    }) => submitWorkflowApi(reviewId, remarks),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};


export const useApproveWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      remarks,
    }: {
      reviewId: string;
      remarks?: string;
    }) => approveWorkflowApi(reviewId, remarks),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};


export const useRejectWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      remarks,
      items,
    }: {
      reviewId: string;
      remarks?: string;
      items?: { issueDescription: string; elementId?: string }[];
    }) => rejectWorkflowApi(reviewId, remarks, items),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};

export const useResolveWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      items,
    }: {
      reviewId: string;
      items: { itemId: string; developerReply?: string }[];
    }) => resolveWorkflowApi(reviewId, items),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};



export const useRequestChangesWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      remarks,
    }: {
      reviewId: string;
      remarks: string;
    }) => requestChangesWorkflowApi(reviewId, remarks),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};



export const usePublishWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: publishWorkflowApi,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};



export const useUnpublishWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: unpublishWorkflowApi,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};


export const useCancelWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: cancelWorkflowApi,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};


export const useReopenWorkflow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: reopenWorkflowApi,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: reviewWorkflowKeys.all,
      });
    },
  });
};