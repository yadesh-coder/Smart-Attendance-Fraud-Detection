import React from 'react';
import { Loader2, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export type AnalysisLoaderState = 'ANALYZING' | 'ANALYSIS_COMPLETE' | 'ANALYSIS_FAILED' | 'SESSION_EXPIRED';

interface AnalysisLoaderProps {
  state: AnalysisLoaderState;
  errorMessage?: string | null;
  onRetry?: () => void;
  onReturnToLiveSessions?: () => void;
}

export const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({
  state,
  errorMessage,
  onRetry,
  onReturnToLiveSessions,
}) => {
  if (state === 'ANALYZING') {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Analyzing Attendance
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Your verification signals are being evaluated.
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Verification signals received. Evaluating attendance security...
          </p>
        </div>
      </div>
    );
  }

  if (state === 'SESSION_EXPIRED') {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Attendance session has ended.
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            The session expired before verification could be finalized.
          </p>
        </div>
        {onReturnToLiveSessions && (
          <Button variant="primary" size="sm" onClick={onReturnToLiveSessions}>
            Return to Live Sessions
          </Button>
        )}
      </div>
    );
  }

  if (state === 'ANALYSIS_FAILED') {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Unable to complete attendance analysis.
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {errorMessage || 'Failed to receive attendance evaluation from backend verification service.'}
          </p>
        </div>
        <div className="flex items-center justify-center space-x-3 pt-2">
          {onRetry && (
            <Button variant="primary" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {onReturnToLiveSessions && (
            <Button variant="outline" size="sm" onClick={onReturnToLiveSessions}>
              Return to Live Sessions
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ANALYSIS_COMPLETE
  return (
    <div className="p-6 text-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
        Analysis Complete
      </p>
    </div>
  );
};
