import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Remounting the subtree is the retry: the view refetches on mount. */
  resetKey: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
  attempt: number;
}

/**
 * Keeps a failing destination contained inside its own panel (FR-024a).
 *
 * The adopted views already report their own fetch failures inline; this is the floor beneath
 * them — if a panel throws outright, the error is shown in that panel, with a retry, and the bar
 * above stays visible and usable so leaving for another destination is still a single tap. The
 * application is never replaced by a full-screen error, and nobody is left stranded.
 *
 * Styled as the accent-filled error block, deliberately unlike the calm dashed note used for a
 * section in preparation: a recoverable failure must not read as a section that was never built,
 * nor the other way round (FR-024b).
 */
export class SectionError extends Component<Props, State> {
  state: State = { failed: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[app-shell] la sección falló', error, info.componentStack);
  }

  componentDidUpdate(previous: Props): void {
    // Moving to a different surface clears a failure that belonged to the previous one.
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  private retry = (): void => {
    this.setState((state) => ({ failed: false, attempt: state.attempt + 1 }));
  };

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="app-state app-state--error" role="alert">
          <p className="app-state__title">No pudimos cargar esta sección</p>
          <p className="app-state__body">
            Puede ser un problema de conexión. Probá de nuevo, o pasá a otro destino desde la barra.
          </p>
          <button type="button" className="nb-button" onClick={this.retry}>
            Reintentar
          </button>
        </div>
      );
    }
    return <div key={this.state.attempt}>{this.props.children}</div>;
  }
}
