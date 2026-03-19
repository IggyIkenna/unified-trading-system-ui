import { useAuth } from "@unified-trading/ui-auth";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@unified-trading/ui-kit";

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Execution Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Sign in to access backtesting and strategy analysis tools.
          </p>
          <Button className="w-full" onClick={() => login()}>
            Login with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
