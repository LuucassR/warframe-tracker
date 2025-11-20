import { useState, useEffect } from 'react'
import { Hammer, Sparkles, Save, Trash2 } from 'lucide-react'

// Tipos simples
interface Item {
  id: number
  name: string
  type: 'Warframe' | 'Weapon'
  owned: boolean
}

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [newItemName, setNewItemName] = useState('')

  // Simulación de carga local (localStorage para test rápido)
  useEffect(() => {
    const saved = localStorage.getItem('wf-inventory')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  // Guardar cambios
  const saveLocal = (currentItems: Item[]) => {
    localStorage.setItem('wf-inventory', JSON.stringify(currentItems))
    setItems(currentItems)
  }

  const addItem = () => {
    if (!newItemName) return
    const newItem: Item = {
      id: Date.now(),
      name: newItemName,
      type: 'Warframe',
      owned: false
    }
    saveLocal([...items, newItem])
    setNewItemName('')
  }

  const toggleOwned = (id: number) => {
    const updated = items.map(i => i.id === id ? { ...i, owned: !i.owned } : i)
    saveLocal(updated)
  }

  const deleteItem = (id: number) => {
    const updated = items.filter(i => i.id !== id)
    saveLocal(updated)
  }

  return (
    <div className="min-h-screen bg-wf-dark text-white p-6 font-sans">
      {/* HEADER */}
      <header className="max-w-4xl mx-auto mb-8 border-b border-gray-800 pb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-wf-accent tracking-widest uppercase flex items-center gap-2">
          <Sparkles className="text-wf-gold"/> Tenno Tracker
        </h1>
        <span className="text-xs text-gray-500">v1.0 Static</span>
      </header>

      <main className="max-w-4xl mx-auto">
        
        {/* INPUT AREA */}
        <div className="bg-wf-panel p-6 rounded-lg border border-gray-700 mb-8 flex gap-4 shadow-lg">
          <input 
            type="text" 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Ej: Wisp Prime..." 
            className="flex-1 bg-black/50 border border-gray-600 rounded px-4 py-2 text-white focus:border-wf-accent outline-none"
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <button 
            onClick={addItem}
            className="bg-wf-accent hover:bg-cyan-300 text-black font-bold px-6 py-2 rounded transition-colors flex items-center gap-2"
          >
            <Hammer size={18} /> Craftear/Agregar
          </button>
        </div>

        {/* LIST AREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">
              Tu inventario está vacío, Tenno. Agrega un item arriba.
            </div>
          )}
          
          {items.map(item => (
            <div key={item.id} className={`flex justify-between items-center p-4 rounded border transition-all ${item.owned ? 'bg-green-900/20 border-green-500/50' : 'bg-wf-panel border-gray-700'}`}>
              <div>
                <h3 className={`font-bold text-lg ${item.owned ? 'text-green-400' : 'text-white'}`}>
                  {item.name}
                </h3>
                <span className="text-xs text-gray-400 uppercase">{item.type}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleOwned(item.id)}
                  className={`px-3 py-1 rounded text-xs font-bold border ${item.owned ? 'border-green-500 text-green-500' : 'border-gray-500 text-gray-400 hover:border-white'}`}
                >
                  {item.owned ? 'POSEÍDO' : 'PENDIENTE'}
                </button>
                <button onClick={() => deleteItem(item.id)} className="text-gray-500 hover:text-red-500">
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App