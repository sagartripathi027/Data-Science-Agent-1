import { Link } from "wouter";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="max-w-md w-full text-center px-6">
        <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-secondary flex items-center justify-center transform rotate-12 shadow-2xl">
          <SearchX className="w-10 h-10 text-muted-foreground -rotate-12" />
        </div>
        <h1 className="text-5xl font-display font-bold text-foreground mb-4">404</h1>
        <h2 className="text-xl font-semibold text-foreground/80 mb-6">Pipeline Broken</h2>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          We couldn't find the page or analysis session you're looking for. It might have been deleted or the URL is incorrect.
        </p>
        <Link href="/">
          <Button size="lg" className="w-full gap-2 rounded-xl h-14 text-base">
            <ArrowLeft size={18} />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
