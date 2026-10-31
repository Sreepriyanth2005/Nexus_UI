// src/core/services/smeReviewProgress.service.ts

const IN_PROGRESS_KEY = "sme_in_progress_reviews";

export const smeReviewProgressService = {
  getInProgressList(): string[] {
    try {
      const data = localStorage.getItem(IN_PROGRESS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  
  markAsInProgress(reviewId: string): void {
    try {
      const list = this.getInProgressList();
      if (!list.includes(reviewId)) {
        list.push(reviewId);
        localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error("Failed to mark review in progress", e);
    }
  },
  
  removeFromInProgress(reviewId: string): void {
    try {
      const list = this.getInProgressList();
      const newList = list.filter((id) => id !== reviewId);
      localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to remove review from in progress", e);
    }
  },
  
  isInProgress(reviewId: string): boolean {
    return this.getInProgressList().includes(reviewId);
  }
};
