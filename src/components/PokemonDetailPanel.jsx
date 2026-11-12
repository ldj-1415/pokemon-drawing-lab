import { useEffect, useState } from 'react';
import { loadPokemonProfile } from '../services/pokemonProfile.js';
import { formatDexNumber } from '../utils/search.js';
import { PokemonTypeList } from './PokemonTypeBadge.jsx';
import { Icon } from './Icon.jsx';

function formatSlug(value = '') {
  return String(value).replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatRow({ stat }) {
  const width = Math.min(100, Math.max(3, (stat.value / 180) * 100));
  return (
    <div className="pokemon-stat-row">
      <span className="pokemon-stat-label">{stat.label}</span>
      <span className="pokemon-stat-track">
        <span className="pokemon-stat-fill" style={{ '--stat-width': `${width}%` }} />
      </span>
      <strong>{stat.value}</strong>
    </div>
  );
}

export function PokemonDetailPanel({ pokemon, dexMap }) {
  const [expanded, setExpanded] = useState(true);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const panelId = `pokemon-detail-${pokemon.id}`;

  useEffect(() => {
    if (!expanded || profile || status === 'loading') return undefined;
    setStatus('loading');
    setError(null);
    loadPokemonProfile(pokemon.id)
      .then((result) => {
        if (!result) return;
        setProfile(result);
        setStatus('ready');
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return;
        setError(requestError.message || '详细资料加载失败');
        setStatus('error');
      });
    return undefined;
  }, [expanded, profile, pokemon.id, retry, status]);

  const abilityName = (ability) => ability.nameZh || formatSlug(ability.name);
  const evolutionName = (id, name) => dexMap?.get(id)?.nameZh || formatSlug(name);
  const stats = profile?.stats || [];
  const hasBiology = Boolean(profile?.shapeZh || profile?.colorZh || profile?.habitatZh);
  const hasEvolution = Boolean(profile?.evolutionSteps?.length);
  const hasForms = Boolean(profile?.forms?.length);

  return (
    <div className="pokemon-detail-panel">
      <button
        type="button"
        className="pokemon-detail-toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span className="pokemon-detail-toggle-main">
          <Icon name="bookmark" size={14} />
          宝可梦详细设定
          {status === 'loading' ? <small>读取中…</small> : null}
        </span>
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={15} />
      </button>

      {expanded ? (
        <div className="pokemon-detail-body" id={panelId}>
          {status === 'error' ? (
            <div className="pokemon-detail-error">
              <span><Icon name="alert" size={13} /> 详细资料暂不可用，可能没有本地缓存或网络不可达。</span>
              <button
                type="button"
                className="button button-small button-ghost"
                onClick={() => {
                  setStatus('idle');
                  setRetry((value) => value + 1);
                }}
              >
                重试
              </button>
            </div>
          ) : null}

          <section className="pokemon-detail-section">
            <h4>基本资料</h4>
            <div className="pokemon-detail-basic-grid">
              <div><span>全国图鉴</span><strong>{formatDexNumber(pokemon.id)}</strong></div>
              <div className="pokemon-detail-types"><span>属性</span><PokemonTypeList types={pokemon.types} /></div>
              {profile?.genus ? <div><span>分类</span><strong>{profile.genus}</strong></div> : null}
              {Number.isFinite(profile?.height ?? pokemon.height) ? (
                <div><span>身高</span><strong>{((profile?.height ?? pokemon.height) / 10).toFixed(1)} m</strong></div>
              ) : null}
              {Number.isFinite(profile?.weight ?? pokemon.weight) ? (
                <div><span>体重</span><strong>{((profile?.weight ?? pokemon.weight) / 10).toFixed(1)} kg</strong></div>
              ) : null}
            </div>
          </section>

          {profile?.abilities?.length ? (
            <section className="pokemon-detail-section">
              <h4>特性</h4>
              <div className="pokemon-ability-list">
                {profile.abilities.map((ability) => (
                  <div className="pokemon-ability-card" key={`${ability.name}-${ability.hidden ? 'hidden' : 'normal'}`}>
                    <div className="pokemon-ability-head">
                      <strong>{abilityName(ability)}</strong>
                      <span className={ability.hidden ? 'is-hidden' : ''}>{ability.hidden ? '隐藏特性' : '普通特性'}</span>
                    </div>
                    {ability.description ? <p>{ability.description}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {stats.length ? (
            <section className="pokemon-detail-section">
              <h4>种族值</h4>
              <div className="pokemon-stat-list">
                {stats.map((stat) => <StatRow key={stat.key} stat={stat} />)}
                <div className="pokemon-stat-total">
                  <span>总和</span>
                  <strong>{profile.statTotal}</strong>
                </div>
              </div>
            </section>
          ) : null}

          {profile?.flavor ? (
            <section className="pokemon-detail-section">
              <h4>图鉴描述</h4>
              <blockquote className="pokemon-flavor">
                {profile.flavor.text}
                <cite>{profile.flavor.lang === 'zh' ? '中文图鉴' : 'English Pokédex'}</cite>
              </blockquote>
            </section>
          ) : null}

          {hasBiology ? (
            <section className="pokemon-detail-section">
              <h4>生物特征</h4>
              <div className="pokemon-biology-grid">
                {(profile.shapeZh || profile.colorZh) ? (
                  <div>
                    <span>外观</span>
                    <p>{[profile.shapeZh, profile.colorZh ? `${profile.colorZh}色调` : null].filter(Boolean).join(' · ')}</p>
                  </div>
                ) : null}
                {profile.habitatZh ? <div><span>栖息环境</span><p>{profile.habitatZh}</p></div> : null}
              </div>
            </section>
          ) : null}

          {hasEvolution ? (
            <section className="pokemon-detail-section">
              <h4>进化信息</h4>
              <div className="pokemon-evolution-list">
                {profile.evolutionSteps.map((step, index) => (
                  <div className="pokemon-evolution-step" key={`${step.fromId}-${step.toId}-${index}`}>
                    <span>{evolutionName(step.fromId, step.fromName)}</span>
                    <Icon name="arrow-right" size={12} />
                    <span>{evolutionName(step.toId, step.toName)}</span>
                    <small>{step.condition}</small>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {hasForms ? (
            <section className="pokemon-detail-section">
              <h4>特殊形态</h4>
              <div className="pokemon-form-chips">
                {profile.forms.map((form) => <span key={form.name}>{form.label}</span>)}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
