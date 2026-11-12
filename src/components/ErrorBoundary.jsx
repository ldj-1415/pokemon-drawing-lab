import { Component } from 'react';
import { Icon, PokeballMark } from './Icon.jsx';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Pokémon Drawing Lab] 页面发生异常', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fatal-screen">
          <div className="fatal-card">
            <span className="fatal-mark"><PokeballMark size={54} /></span>
            <span className="eyebrow">SOMETHING WENT WRONG</span>
            <h1>工作台遇到了一点问题</h1>
            <p>
              页面没有白屏。软件的数据仍然保存在浏览器里，重新加载通常可以恢复。
              如果问题持续出现，可以检查浏览器控制台中的错误信息。
            </p>
            <pre>{this.state.error?.message || '未知错误'}</pre>
            <div className="fatal-actions">
              <button type="button" className="button button-primary" onClick={() => window.location.reload()}>
                <Icon name="refresh" size={17} />
                重新加载
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  window.location.hash = '#/workbench';
                  window.location.reload();
                }}
              >
                回到随机工作台
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
