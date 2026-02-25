import { XCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

export default function RejectedScreen() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="max-w-md w-full border-destructive/30 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Access Not Approved
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            Your account request was not approved by the farm administrators.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Unfortunately, your request to access this farm management system was rejected. 
              If you believe this is a mistake, please contact your farm administrator directly.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You may try logging in with a different account or contact your administrator for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
