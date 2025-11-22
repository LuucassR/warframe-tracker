import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Search, Trash2, ShieldCheck, Sparkles, Check, 
  ChevronDown, ChevronUp, MapPin, DollarSign, Download, Upload, 
  Filter, AlertCircle, Hammer, Package, Clock, ExternalLink, X,
  Edit3
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// --- UTILIDADES ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const normalizeCategory = (cat: string): ItemCategory | 'Other' => {
  const c = cat.toLowerCase()
  if (c.includes('warframe')) return 'Warframes'
  if (c.includes('primary')) return 'Primary'
  if (c.includes('secondary')) return 'Secondary'
  if (c.includes('melee') && !c.includes('arch')) return 'Melee'
  if (c.includes('arch') || c.includes('archwing')) return 'Archwing' 
  if (c.includes('companion') || c.includes('sentinel') || c.includes('robotic') || c.includes('pet')) return 'Companions'
  return 'Other'
}

const generateMarketSlug = (name: string) => {
  let slug = name.toLowerCase().replace(/ /g, '_').replace(/'/g, '').replace(/-/g, '_')
  if (name.toLowerCase().includes('prime') && !name.toLowerCase().includes('set')) {
    slug += '_set'
  }
  return slug
}

// --- TIPOS ---
const CDN_BASE = "https://cdn.warframestat.us/img/"
const DATA_SOURCE = "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json"

type ItemCategory = 'Warframes' | 'Primary' | 'Secondary' | 'Melee' | 'Archwing' | 'Companions' | 'Other'
type FarmingStatus = 'none' | 'farming' | 'waiting_parts' | 'ready_to_build' | 'to_sell' | 'built'

const STATUS_CONFIG: Record<FarmingStatus, { label: string, color: string, icon: any, border: string }> = {
  none: { label: 'Sin estado', color: 'text-gray-500', icon: AlertCircle, border: 'border-gray-800' },
  farming: { label: 'Farmeando', color: 'text-orange-400', icon: MapPin, border: 'border-orange-500/50' },
  waiting_parts: { label: 'Faltan partes', color: 'text-yellow-400', icon: Clock, border: 'border-yellow-500/50' },
  ready_to_build: { label: 'Listo craft', color: 'text-blue-400', icon: Hammer, border: 'border-blue-500/50' },
  to_sell: { label: 'Vender', color: 'text-green-400', icon: DollarSign, border: 'border-green-500/50' },
  built: { label: 'Construido', color: 'text-purple-400', icon: Package, border: 'border-purple-500/50' },
}

interface Drop {
  location: string
  type: string
  chance?: number | null
  rarity?: string
}

interface Component {
  uniqueName: string
  name: string
  itemCount: number
  imageName?: string
  drops?: Drop[]
  owned: boolean 
}

interface ApiItem {
  uniqueName: string
  name: string
  category: ItemCategory
  imageName: string
  isPrime: boolean
  description?: string
  masteryReq?: number
  components?: Component[] 
  drops?: Drop[] 
}

interface UserItem extends ApiItem {
  id: number // Timestamp + Random para unicidad absoluta
  owned: boolean
  mastered: boolean
  status: FarmingStatus
  duplicates: number
  notes?: string // Nuevo campo para diferenciar builds
}

// --- SUB-COMPONENTES ---

const ProgressBar = ({ total, current, owned }: { total: number, current: number, owned: boolean }) => {
  let percent = 0
  if (total === 0) {
    percent = owned ? 100 : 0
  } else {
    percent = (current / total) * 100
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 z-10">
      <div 
        className={cn("h-full transition-all duration-500", percent === 100 ? "bg-green-500" : "bg-wf-accent")} 
        style={{ width: `${percent}%` }} 
      />
    </div>
  )
}

const ItemHeader = ({ item, onClick }: { item: UserItem, expanded: boolean, onClick: () => void }) => {
  const statusConfig = STATUS_CONFIG[item.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="relative aspect-video bg-black/40 p-4 flex items-center justify-center cursor-pointer group overflow-hidden" onClick={onClick}>
      <img 
        src={item.imageName ? `${CDN_BASE}${item.imageName}` : '/placeholder.png'} 
        alt={item.name} 
        className="h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image'}
      />
      
      {/* Badges */}
      {item.isPrime && <span className="absolute top-2 right-2 bg-wf-gold text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">PRIME</span>}
      {item.mastered && <span className="absolute top-2 right-item isPrime ? '14' : '2' mr-2 bg-gray-800 text-wf-gold border border-wf-gold/30 p-1 rounded-full z-10"><ShieldCheck size={12}/></span>}

      {/* Status Badge */}
      <div className={cn("absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 bg-black/80 backdrop-blur border z-10 transition-colors", statusConfig.color, statusConfig.border)}>
        <StatusIcon size={10} />
        {statusConfig.label}
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
    </div>
  )
}

const StatusSelector = ({ current, onChange }: { current: FarmingStatus, onChange: (s: FarmingStatus) => void }) => {
  return (
    <div className="mb-4">
      <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Estado del Proyecto</label>
      <div className="grid grid-cols-3 gap-1">
        {(Object.keys(STATUS_CONFIG) as FarmingStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => onChange(status)}
            className={cn(
              "text-[10px] py-1.5 px-1 rounded border transition-all flex justify-center items-center gap-1",
              current === status 
                ? `bg-gray-800 ${STATUS_CONFIG[status].color} border-gray-600 font-bold shadow-inner` 
                : "border-gray-800 text-gray-600 hover:bg-gray-800 hover:text-gray-400"
            )}
          >
            <span className="truncate">{STATUS_CONFIG[status].label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const ComponentsList = ({ item, onToggleComp }: { item: UserItem, onToggleComp: (idx: number) => void }) => {
  if (!item.components || item.components.length === 0) {
    return (
      <div className="bg-black/20 rounded p-3 border border-gray-800 mb-3">
        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
          <MapPin size={12} className="text-wf-accent"/> Fuentes de obtención
        </h4>
        {item.drops && item.drops.length > 0 ? (
          <ul className="space-y-1">
            {item.drops.slice(0, 4).map((d, i) => (
              <li key={i} className="text-[10px] text-gray-400 flex justify-between">
                <span className="truncate max-w-[70%]">{d.location}</span>
                <span className="text-gray-600">{d.chance ? `${d.chance.toFixed(1)}%` : d.rarity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] text-gray-600 italic">No hay datos de drop disponibles.</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-black/20 rounded p-3 border border-gray-800 mb-3">
      <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2"><Hammer size={12}/> Componentes</h4>
      <div className="space-y-3">
        {item.components.map((comp, idx) => (
          <div key={idx} className="group/comp">
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", comp.owned ? "bg-wf-accent border-wf-accent" : "border-gray-600 group-hover/comp:border-gray-400")}>
                    <input type="checkbox" className="hidden" checked={comp.owned} onChange={() => onToggleComp(idx)} />
                    {comp.owned && <Check size={10} className="text-black" />}
                </div>
                <span className={cn("text-xs", comp.owned ? "text-gray-500 line-through" : "text-gray-300")}>
                  {comp.itemCount}x {comp.name}
                </span>
              </label>
            </div>
            
            {!comp.owned && comp.drops && comp.drops.length > 0 && (
              <div className="pl-6 text-[10px] text-gray-500 border-l border-gray-800 ml-2 space-y-0.5">
                {comp.drops.slice(0, 2).map((d, i) => (
                  <div key={i} className="flex justify-between">
                      <span className="truncate max-w-[120px]">{d.location}</span>
                      <span className="text-gray-700">{d.rarity || (d.chance + '%')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- TARJETA PRINCIPAL ---
const ItemCard = React.memo(({ 
  item, updateItem, deleteItem 
}: { 
  item: UserItem, 
  updateItem: (id: number, changes: Partial<UserItem>) => void, 
  deleteItem: (id: number) => void 
}) => {
  const [expanded, setExpanded] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteTemp, setNoteTemp] = useState(item.notes || '')
  
  const marketSlug = generateMarketSlug(item.name)

  const handleStatusChange = (status: FarmingStatus) => updateItem(item.id, { status })
  const handleToggleProp = (prop: keyof UserItem) => updateItem(item.id, { [prop]: !item[prop] })
  
  const saveNote = () => {
    updateItem(item.id, { notes: noteTemp })
    setIsEditingNote(false)
  }

  const handleToggleComponent = (idx: number) => {
    if (!item.components) return
    const newComps = [...item.components]
    newComps[idx] = { ...newComps[idx], owned: !newComps[idx].owned }
    
    // Auto-logic: Si completo todo -> Ready to build
    const allOwned = newComps.every(c => c.owned)
    let newStatus = item.status
    if (allOwned && item.status === 'farming') newStatus = 'ready_to_build'
    
    updateItem(item.id, { components: newComps, status: newStatus })
  }

  const compTotal = item.components?.length || 0
  const compOwned = item.components?.filter(c => c.owned).length || 0

  return (
    <div className={cn(
      "bg-wf-panel border rounded-lg overflow-hidden transition-all duration-300 flex flex-col",
      STATUS_CONFIG[item.status].border,
      expanded ? "row-span-2 col-span-1 md:col-span-2 z-20 shadow-2xl scale-[1.01]" : "shadow hover:shadow-lg"
    )}>
      <ItemHeader item={item} expanded={expanded} onClick={() => setExpanded(!expanded)} />
      <ProgressBar total={compTotal} current={compOwned} owned={item.owned} />

      <div className="p-4 flex-1 flex flex-col">
        {/* Título y Notas */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 mr-2 overflow-hidden">
            <h3 className="font-bold text-white text-lg leading-tight truncate">{item.name}</h3>
            
            {/* Edición de Nota / Apodo */}
            <div onClick={e => e.stopPropagation()} className="mt-1 h-6">
              {isEditingNote ? (
                <div className="flex items-center gap-1 animate-in fade-in">
                  <input 
                    className="bg-gray-900 border border-gray-700 text-xs px-2 py-0.5 rounded text-white w-full focus:border-wf-accent outline-none"
                    value={noteTemp}
                    onChange={(e) => setNoteTemp(e.target.value)}
                    placeholder="Ej: Build Eidolon..."
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveNote()}
                  />
                  <button onClick={saveNote} className="text-green-400 hover:text-green-300"><Check size={14}/></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/note">
                  <p 
                    onClick={() => { setIsEditingNote(true); setExpanded(true); }} 
                    className={cn("text-xs cursor-pointer truncate", item.notes ? "text-wf-accent italic" : "text-gray-600")}
                  >
                    {item.notes || item.category}
                  </p>
                  <button onClick={() => setIsEditingNote(true)} className="opacity-0 group-hover/note:opacity-100 text-gray-500 hover:text-white transition-opacity">
                    <Edit3 size={10}/>
                  </button>
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-white shrink-0 mt-1">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* Contenido Expandible */}
        {expanded ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 flex-1 flex flex-col">
            <StatusSelector current={item.status} onChange={handleStatusChange} />
            <ComponentsList item={item} onToggleComp={handleToggleComponent} />
            
            <div className="mt-auto pt-4">
               <button 
                onClick={() => handleToggleProp('owned')}
                className={cn("w-full py-2 rounded text-xs font-bold border transition-colors flex justify-center items-center gap-2 mb-4", item.owned ? "bg-green-900/20 border-green-500 text-green-400" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700")}
              >
                {item.owned ? <Check size={14}/> : null}
                {item.owned ? 'ITEM COMPLETADO' : 'MARCAR COMO POSEÍDO'}
              </button>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-800 mt-auto">
                <div className="flex gap-1">
                  <button onClick={() => handleToggleProp('mastered')} className={cn("p-1.5 rounded transition-colors", item.mastered ? "text-wf-gold bg-wf-gold/10" : "text-gray-600 hover:text-white")} title="Toggle Mastered">
                    <ShieldCheck size={16}/>
                  </button>
                  <a href={`https://warframe.market/items/${marketSlug}`} target="_blank" rel="noreferrer" className="p-1.5 rounded text-gray-600 hover:text-green-400 hover:bg-green-900/10"><DollarSign size={16}/></a>
                  <a href={`https://warframe.fandom.com/wiki/${item.name.replace(/ /g, '_')}`} target="_blank" rel="noreferrer" className="p-1.5 rounded text-gray-600 hover:text-blue-400 hover:bg-blue-900/10"><ExternalLink size={16}/></a>
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-500 p-1.5">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex items-center gap-2 pt-2">
             <button 
              onClick={(e) => { e.stopPropagation(); handleToggleProp('owned') }}
              className={cn("flex-1 py-1.5 rounded text-[10px] font-bold border transition-colors text-center", item.owned ? "bg-green-900/20 border-green-500 text-green-400" : "border-gray-700 text-gray-500 hover:bg-gray-800 hover:text-gray-300")}
            >
              {item.owned ? 'POSEÍDO' : 'PENDIENTE'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

// --- APP PRINCIPAL ---
function App() {
  const [catalog, setCatalog] = useState<ApiItem[]>([])
  const [inventory, setInventory] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Filtros
  const [catFilter, setCatFilter] = useState<ItemCategory | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<FarmingStatus | 'All'>('All')
  const [hideMastered, setHideMastered] = useState(false)

  // Carga Inicial
  useEffect(() => {
    const init = async () => {
      const savedInv = localStorage.getItem('wf-inventory-v2')
      if (savedInv) {
        try {
          const parsed = JSON.parse(savedInv)
          // Migración simple si vienen de la versión anterior sin ID numérico
          const migrated = parsed.map((i: any) => ({
            ...i,
            id: i.id || Date.now() + Math.random(),
            notes: i.notes || ''
          }))
          setInventory(migrated)
        } catch(e) { console.error("Error parsing save", e) }
      }

      try {
        const res = await fetch(DATA_SOURCE)
        if (!res.ok) throw new Error("Failed to load catalog")
        const data = await res.json()

        const cleanCatalog: ApiItem[] = data
          .filter((i: any) => 
            !i.uniqueName.includes('Recipes') && 
            !i.name.includes('Twitch') &&
            ['Warframes', 'Primary', 'Secondary', 'Melee', 'Arch-Gun', 'Arch-Melee', 'Archwing', 'Sentinels', 'Pets'].some(c => i.category.includes(c))
          )
          .map((i: any) => ({
            uniqueName: i.uniqueName,
            name: i.name,
            category: normalizeCategory(i.category),
            imageName: i.imageName,
            isPrime: i.name.includes('Prime'),
            description: i.description,
            masteryReq: i.masteryReq,
            drops: i.drops,
            components: i.components ? i.components.map((c: any) => ({
              uniqueName: c.uniqueName || c.name,
              name: c.name,
              itemCount: c.itemCount,
              imageName: c.imageName,
              drops: c.drops,
              owned: false
            })) : []
          }))

        setCatalog(cleanCatalog)
      } catch (e) {
        console.error("Error loading catalog", e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Auto-guardado
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('wf-inventory-v2', JSON.stringify(inventory))
    }
  }, [inventory, loading])

  // --- Lógica de Negocio ---

  const addItem = useCallback((catItem: ApiItem) => {
    // Permitimos duplicados. Generamos ID único.
    const newItem: UserItem = {
      ...catItem,
      id: Date.now() + Math.random(),
      owned: false,
      mastered: false,
      status: 'farming',
      duplicates: 0,
      notes: ''
    }
    setInventory(prev => [newItem, ...prev])
    setSearch('')
  }, [])

  const updateItem = useCallback((id: number, changes: Partial<UserItem>) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i))
  }, [])

  const deleteItem = useCallback((id: number) => {
    setInventory(prev => prev.filter(i => i.id !== id))
  }, [])

  const searchResults = useMemo(() => {
    if (search.length < 2) return []
    return catalog
      .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 10)
  }, [search, catalog])

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => {
      if (catFilter !== 'All' && i.category !== catFilter) return false
      if (statusFilter !== 'All' && i.status !== statusFilter) return false
      if (hideMastered && i.mastered) return false
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [inventory, catFilter, statusFilter, hideMastered, search])

  // Agrupación por categorías para la vista
  const groupedInventory = useMemo(() => {
    // Si hay un filtro específico de categoría, mostramos solo esa como un grupo
    if (catFilter !== 'All') return { [catFilter]: filteredInventory }
    
    // Si es "All", agrupamos todo lo filtrado
    const groups: Record<string, UserItem[]> = {}
    filteredInventory.forEach(item => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    
    // Ordenar claves visualmente
    const orderedGroups: Record<string, UserItem[]> = {}
    const order = ['Warframes', 'Primary', 'Secondary', 'Melee', 'Companions', 'Archwing', 'Other']
    
    // Primero los del orden establecido
    order.forEach(key => {
      if (groups[key] && groups[key].length > 0) orderedGroups[key] = groups[key]
    })
    // Luego el resto si hubiera
    Object.keys(groups).forEach(key => {
      if (!order.includes(key)) orderedGroups[key] = groups[key]
    })
    
    return orderedGroups
  }, [filteredInventory, catFilter])

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (Array.isArray(data)) {
          // Asegurar IDs al importar
          const cleanData = data.map(i => ({...i, id: i.id || Date.now() + Math.random()}))
          setInventory(cleanData)
          alert("Importado con éxito")
        }
      } catch (e) { alert("JSON inválido") }
    }
    reader.readAsText(file)
  }
  
  const handleExport = () => {
    const a = document.createElement('a')
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inventory))
    a.download = 'wf-tracker-backup.json'
    a.click()
  }

  const stats = {
    mastered: inventory.filter(i => i.mastered).length,
    farming: inventory.filter(i => i.status === 'farming').length
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white flex-col">
      <Sparkles className="animate-spin text-wf-accent mb-4" size={40}/>
      <p className="text-sm font-mono animate-pulse">Conectando con WFCD Database...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 font-sans pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 border-b border-gray-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-wf-gold" />
            <h1 className="font-bold text-xl tracking-widest text-white">TENNO<span className="text-wf-accent">TRACKER</span></h1>
            <div className="h-6 w-px bg-gray-700 mx-2"/>
            <div className="flex gap-3 text-xs font-mono text-gray-500">
              <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-wf-gold"/> {stats.mastered}</span>
              <span className="flex items-center gap-1"><MapPin size={12} className="text-orange-400"/> {stats.farming}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:max-w-lg group z-50">
            <div className="flex items-center bg-gray-900/80 border border-gray-700 rounded px-3 py-2 focus-within:border-wf-accent focus-within:ring-1 focus-within:ring-wf-accent transition-all">
              <Search size={16} className="text-gray-500 mr-2" />
              <input 
                className="bg-transparent outline-none text-sm w-full placeholder-gray-600 text-white"
                placeholder="Buscar Warframe, Arma, Archwing..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch('')}><X size={14} className="text-gray-500 hover:text-white"/></button>}
            </div>
            
            {/* Autocomplete Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-[#12121a] border border-gray-700 mt-1 rounded shadow-2xl max-h-80 overflow-y-auto">
                {searchResults.map(item => {
                  const count = inventory.filter(i => i.uniqueName === item.uniqueName).length
                  return (
                    <button 
                      key={item.uniqueName}
                      onClick={() => addItem(item)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-3 border-b border-gray-800/50 last:border-0"
                    >
                      <img src={`${CDN_BASE}${item.imageName}`} className="w-8 h-8 object-contain bg-gray-900 rounded" alt=""/>
                      <div className="flex-1">
                        <p className={cn("text-sm font-bold", item.isPrime ? "text-wf-gold" : "text-white")}>{item.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{item.category}</p>
                      </div>
                      {count > 0 ? (
                        <span className="text-[10px] bg-gray-700 text-white px-2 py-0.5 rounded border border-gray-600">
                          {count} COPIAS
                        </span>
                      ) : (
                        <span className="text-[10px] bg-wf-accent text-black px-1.5 py-0.5 rounded font-bold">+ ADD</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2">
             <button onClick={handleExport} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white"><Download size={18}/></button>
             <label className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white cursor-pointer"><Upload size={18}/><input type="file" className="hidden" onChange={handleImport}/></label>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-[#12121a] border-b border-gray-800 py-2 px-4 overflow-x-auto">
           <div className="flex items-center gap-3 min-w-max max-w-7xl mx-auto">
              <Filter size={14} className="text-gray-500"/>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value as any)} className="bg-black border border-gray-700 text-xs rounded px-2 py-1 text-gray-300 focus:border-wf-accent outline-none">
                <option value="All">Todas Categorías</option>
                <option value="Warframes">Warframes</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="Melee">Melee</option>
                <option value="Archwing">Archwing</option>
                <option value="Companions">Companions</option>
              </select>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-black border border-gray-700 text-xs rounded px-2 py-1 text-gray-300 focus:border-wf-accent outline-none">
                <option value="All">Todos Estados</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>

              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none hover:text-white">
                <input type="checkbox" checked={hideMastered} onChange={e => setHideMastered(e.target.checked)} className="rounded bg-gray-800 border-gray-600"/>
                Ocultar Mastered
              </label>
           </div>
        </div>
      </header>

      {/* Content - Agrupado */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredInventory.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Package size={60} className="mx-auto mb-4 text-gray-700"/>
            <h2 className="text-xl font-bold text-gray-500">Inventario Vacío</h2>
            <p className="text-sm text-gray-600">Usa el buscador para añadir items desde la base de datos.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedInventory).map(([category, items]) => (
              <section key={category} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-800/50">
                   {category === 'Warframes' && <ShieldCheck className="text-wf-gold"/>}
                   {category === 'Primary' && <Hammer className="text-blue-400"/>}
                   {category === 'Secondary' && <DollarSign className="text-purple-400"/>}
                   <h2 className="text-xl font-bold text-gray-200 tracking-wider uppercase">{category}</h2>
                   <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                  {items.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      updateItem={updateItem} 
                      deleteItem={deleteItem} 
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App