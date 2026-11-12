import { useEffect, useMemo, useRef, useState } from 'react';
import { useLab } from '../context/LabContext.jsx';
import { searchPokemon } from '../utils/search.js';
import { getPokemonFilterConflicts } from '../utils/filters.js';
import { formatDexNumber } from '../utils/search.js';
import { Modal } from './Modal.jsx';
import { PokemonImage } from './PokemonImage.jsx';
import { PokemonTypeList } from './PokemonTypeBadge.jsx';
import { Icon } from './Icon.jsx';

const QUICK_SEARCHES = [
  { label: '皮卡丘', query: '皮卡丘' },
  { label: '伊布', query: '伊布' },
  { label: '喷火龙', query: '喷火龙' },
  { label: '耿鬼', query: '耿鬼' },
  { label: '路卡利欧', query: '路卡利欧' },
  { label: '新叶喵', query: '新叶喵' },
];

export function PokemonSearchModal({ open, onClose }) {
  const {
    dex,
    candidatePool,
    settings,
    current,
    lockedCount,
    imageMode,
    addLockedPokemon,
    toggleCurrentPokemonLock,
  } = useLab();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  const results = useMemo(() => searchPokemon(dex, query, 40), [dex, query]);
  const currentById = useMemo(() => {
    const map = new Map();
    current.pokemon.forEach((entry, slotIndex) => {
      const existing = map.get(entry.id);
      // Prefer an already locked slot so duplicate IDs correctly show as locked.
      if (!existing || (entry.locked && !existing.locked)) {
        map.set(entry.id, { ...entry, slotIndex });
      }
    });
    return map;
  }, [current.pokemon]);
  const lockedEntries = current.pokemon
    .map((entry, slotIndex) => ({ ...entry, slotIndex }))
    .filter((entry) => entry.locked);
  const full = current.pokemon.length >= settings.count;
  const lockedFull = lockedCount >= settings.count;
  const remainingSlots = Math.max(0, settings.count - current.pokemon.length);

  const actionState = (pokemon) => {
    const existing = currentById.get(pokemon.id);
    if (existing?.locked) {
      return { label: '已锁定', disabled: true, tone: 'locked', slotIndex: existing.slotIndex };
    }
    if (existing) {
      return { label: '锁定此只', disabled: lockedFull, tone: 'lock', slotIndex: existing.slotIndex };
    }
    if (full) {
      return { label: '本轮已满', disabled: true, tone: 'muted' };
    }
    if (lockedFull) {
      return { label: '锁定已满', disabled: true, tone: 'muted' };
    }
    return { label: '加入锁定', disabled: false, tone: 'primary' };
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="手动锁定宝可梦"
      eyebrow="LOCK A POKÉMON"
      icon="search"
      size="lg"
      className="search-modal"
      footer={(
        <div className="modal-footer-info">
          <span><Icon name="lock" size={14} /> 已锁定 {lockedEntries.length} / {settings.count}</span>
          <span className="muted-text">锁定只在当前绘画组合中生效</span>
        </div>
      )}
    >
      <div className="search-summary">
        <div>
          <span className="eyebrow">CURRENT ROUND</span>
          <p>
            本轮槽位 {current.pokemon.length}/{settings.count}
            <span className="dot-separator">·</span>
            还可加入 {remainingSlots} 只
          </p>
        </div>
        <span className="pool-pill">候选池 {candidatePool.length} 只</span>
      </div>

      {lockedEntries.length ? (
        <div className="locked-strip" aria-label="当前已锁定的宝可梦">
          {lockedEntries.map((entry) => {
            const pokemon = dex.find((item) => item.id === entry.id);
            if (!pokemon) return null;
            return (
              <span className="locked-chip-lg" key={`${entry.id}-${entry.slotIndex}`}>
                <PokemonImage pokemon={pokemon} mode={imageMode} size="micro" />
                <span>{pokemon.nameZh || pokemon.nameEn}</span>
                <button
                  type="button"
                  onClick={() => toggleCurrentPokemonLock(entry.slotIndex)}
                  aria-label={`解除锁定 ${pokemon.nameZh || pokemon.nameEn}`}
                  title="解除锁定"
                >
                  <Icon name="close" size={13} />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <div className="inline-note">
          <Icon name="info" size={15} />
          还没有锁定宝可梦。搜索后加入，锁定对象在整体重抽时不会被替换。
        </div>
      )}

      <div className="search-box">
        <Icon name="search" size={20} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索中文名、英文名或全国图鉴编号，例如：皮卡丘 / Pikachu / 25"
          aria-label="搜索宝可梦"
        />
        {query ? (
          <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="清空搜索">
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>

      {!query ? (
        <div className="search-idle">
          <p>输入关键词开始检索，也可以快速试试这些宝可梦：</p>
          <div className="quick-search-row">
            {QUICK_SEARCHES.map((item) => (
              <button
                key={item.query}
                type="button"
                className="quick-chip"
                onClick={() => setQuery(item.query)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="search-hint">
            图鉴包含全国编号 1–1025 的 {dex.length.toLocaleString('zh-CN')} 只宝可梦。地区形态不会作为独立编号混入。
          </p>
        </div>
      ) : (
        <div className="search-results-wrap">
          <div className="search-results-head">
            <span>搜索结果</span>
            <span>{results.length} 条匹配</span>
          </div>
          {results.length ? (
            <div className="search-results">
              {results.map((pokemon) => {
                const state = actionState(pokemon);
                const conflicts = getPokemonFilterConflicts(pokemon, settings);
                return (
                  <div className={`search-result ${conflicts.length ? 'has-conflict' : ''}`.trim()} key={pokemon.id}>
                    <PokemonImage pokemon={pokemon} mode={imageMode} size="search" />
                    <div className="search-result-info">
                      <div className="search-result-title">
                        <strong>{pokemon.nameZh || pokemon.nameEn}</strong>
                        <span>{formatDexNumber(pokemon.id)}</span>
                      </div>
                      <span className="search-english">{pokemon.nameEn}</span>
                      <PokemonTypeList types={pokemon.types} size="small" />
                      {conflicts.length ? (
                        <span className="search-conflict">
                          <Icon name="alert" size={12} />
                          当前筛选范围外：{conflicts[0]}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={`button button-small ${
                        state.tone === 'primary'
                          ? 'button-primary'
                          : state.tone === 'locked'
                            ? 'button-lock-active'
                            : 'button-ghost'
                      }`.trim()}
                      onClick={() => {
                        if (state.tone === 'lock') toggleCurrentPokemonLock(state.slotIndex);
                        else addLockedPokemon(pokemon);
                      }}
                      disabled={state.disabled}
                    >
                      {state.tone === 'locked' ? <Icon name="check" size={14} /> : <Icon name="lock" size={14} />}
                      {state.label}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="search-empty">
              <Icon name="search" size={24} />
              <strong>没有找到匹配的宝可梦</strong>
              <p>请确认中文名、英文名或编号是否正确，也可以只输入前几个字。</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
