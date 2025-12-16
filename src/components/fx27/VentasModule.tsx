5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[8px] px-1 py-0.5 rounded whitespace-nowrap z-10">{fmt(d.ventas)}</div>
                  <div className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t" style={{ height: `${h}%`, minHeight: d.ventas > 0 ? '2px' : '0' }} />
                </div>
                <span className="text-white/30 text-[8px] mt-1">{m}</span>
              </div>;
            })}
          </div>
        </div>
      </div>
    );
  };

  const Chat = () => (
    <div className="h-[400px] flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-lg">
      <div className="p-2 border-b border-white/[0.06] flex items-center gap-2"><Sparkles className="w-3 h-3 text-orange-400" /><span className="text-white text-xs font-medium">Análisis IA</span></div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        {chatMsgs.length === 0 && <div className="text-center text-white/30 py-4"><Bot className="w-6 h-6 mx-auto mb-1 opacity-50" /><p className="text-[10px]">Pregunta sobre ventas</p></div>}
        {chatMsgs.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-2 rounded-lg text-[10px] ${m.role === 'user' ? 'bg-orange-500/20 text-white' : 'bg-white/5 text-white/80'}`}>{m.content}</div></div>)}
        {chatLoad && <div className="flex justify-start"><div className="bg-white/5 rounded-lg p-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /><span className="text-[10px] text-white/50">...</span></div></div>}
      </div>
      <div className="p-2 border-t border-white/[0.06] flex gap-1">
        <input type="text" value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarChat()} placeholder="Pregunta..." className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-[10px] placeholder-white/30" />
        <button onClick={enviarChat} disabled={chatLoad || !chatIn.trim()} className="px-2 py-1 bg-orange-500/20 rounded text-orange-400 disabled:opacity-50"><Send className="w-3 h-3" /></button>
      </div>
    </div>
  );

  return (
    <ModuleTemplate title="Ventas" subtitle={userPermisos.vendedor ? `Vendedor: ${userPermisos.vendedor}` : "Análisis Grupo Loma & TROB USA"} icon={TrendingUp} accentColor="orange" backgroundImage={MODULE_IMAGES.ventas} onBack={onBack}>
      <ModalFiltros />
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button onClick={() => setVista('dashboard')} className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 ${vista === 'dashboard' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50'}`}><BarChart3 className="w-3 h-3" />Dashboard</button>
          <button onClick={() => setVista('chat')} className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 ${vista === 'chat' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50'}`}><Sparkles className="w-3 h-3" />IA</button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/40 text-[10px]">{yearAplicado}</span>
          <button onClick={abrirFiltros} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${nFiltros ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50'}`}>
            <Filter className="w-3 h-3" />Filtros{nFiltros > 0 && <span className="bg-orange-500 text-white text-[8px] px-1 rounded-full">{nFiltros}</span>}
          </button>
          <button onClick={cargarDatos} className="p-1 bg-white/5 hover:bg-white/10 rounded"><RefreshCw className="w-3 h-3 text-white/50" /></button>
          <span className="text-[9px] text-white/30 flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-500" />{ultimaAct}</span>
        </div>
      </div>
      {vista === 'dashboard' ? <Dashboard /> : <Chat />}
    </ModuleTemplate>
  );
}

export default VentasModule;
