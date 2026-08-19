import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collectErrorContext, reportError } from "@/lib/errorReporting";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    reportError(error, {
      source: "react-error-boundary",
      componentStack: info.componentStack,
    });
  }

  handleReload = () => {
    // Limpa flags de retry de chunk para o mecanismo de retry funcionar limpo.
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("chunk-retry-")) sessionStorage.removeItem(key);
    });
    window.location.reload();
  };

  /** Tenta remontar a árvore sem recarregar a página (erros transitórios). */
  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, error: null, resetKey: prev.resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message ?? "";
      const isChunkError =
        message.includes("Loading chunk") ||
        message.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.name === "ChunkLoadError";
      const context = collectErrorContext();

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
                  : "Ocorreu um erro inesperado nesta tela. Você pode tentar novamente ou recarregar a página."}
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={this.handleRetry} className="w-full gap-2">
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Recarregar página
              </Button>
            </div>

            <details className="text-left">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-[10px] leading-relaxed text-muted-foreground">
                {`${this.state.error?.name ?? "Error"}: ${message}\nrota: ${context.route}\nnavegador: ${context.userAgent}`}
              </pre>
            </details>

            <a
              href="mailto:biancadealbuquerquep@gmail.com"
              className="block text-xs text-muted-foreground underline"
            >
              Problema persiste? Fale conosco
            </a>
          </div>
        </div>
      );
    }

    return <div key={this.state.resetKey} className="contents">{this.props.children}</div>;
  }
}

export default GlobalErrorBoundary;
