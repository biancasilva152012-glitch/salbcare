import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    // Clear all chunk-retry flags so the retry mechanism works fresh
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("chunk-retry-")) sessionStorage.removeItem(key);
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("Loading chunk") ||
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.name === "ChunkLoadError";

      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="mx-auto max-w-sm space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">
                {isChunkError ? "Atualização disponível" : "Algo deu errado"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isChunkError
                  ? "Uma nova versão do app está disponível. Recarregue a página para continuar."
                  : "Ocorreu um erro inesperado. Tente recarregar a página."}
              </p>
            </div>

            <Button onClick={this.handleReload} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Recarregar página
            </Button>

            <a
              href="mailto:contato@salbcare.com.br"
              className="block text-xs text-muted-foreground underline"
            >
              Problema persiste? Fale conosco
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
