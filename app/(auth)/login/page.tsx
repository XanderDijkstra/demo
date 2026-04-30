import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            V
          </div>
          <CardTitle className="text-xl">Vekst-Systemet</CardTitle>
          <CardDescription>Innloggingen kommer i Stage 3</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Stage 1: prosjekt-stillas (Next.js, Tailwind, shadcn).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
