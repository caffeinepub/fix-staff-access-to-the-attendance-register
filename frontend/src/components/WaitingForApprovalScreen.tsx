import { Clock, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequestApproval, useIsCallerApproved } from '../hooks/useQueries';
import { useState } from 'react';

export default function WaitingForApprovalScreen() {
  const { mutate: requestApproval, isPending } = useRequestApproval();
  const { refetch, isRefetching } = useIsCallerApproved(true);
  const [requested, setRequested] = useState(false);

  const handleRequestApproval = () => {
    requestApproval(undefined, {
      onSuccess: () => {
        setRequested(true);
      },
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="max-w-md w-full border-border shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Awaiting Approval
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            Your account is pending verification by an existing farm member.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">What happens next?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  An existing verified farm member will review your account and grant you access to the farm management dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {!requested ? (
              <Button
                onClick={handleRequestApproval}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending Request...
                  </>
                ) : (
                  'Request Approval'
                )}
              </Button>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-primary font-medium">
                  ✓ Approval request sent! Please wait for a farm member to review your account.
                </p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefetching}
              className="w-full"
            >
              {isRefetching ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Approval Status
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If you believe this is an error, please contact your farm administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
