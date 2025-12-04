
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../services/db';
import { InventoryItem, Product, User, InventoryCategory } from '../types';
import { Plus, Search, Edit, Package, Save, X, Monitor, Wrench, ClipboardList, ShoppingBag, Calendar, ShieldCheck, Box } from 'lucide-react';

interface InventoryProps {
  user: User;
}

type Tab = InventoryCategory | 'Productos para la Venta';

export const Inventory: React.FC<InventoryProps> = ({ user }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('Insumos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [currentInternal, setCurrentInternal] = useState<Partial<InventoryItem>>({
      name: '', category: 'Insumos', quantity: 0, description: '', location: '', purchaseDate: '', warranty: '', unitCost: 0
  });

  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '', sku: '', description: '', price: 0, cost: 0, stock: 0, active: true
  });

  useEffect(() => {
    refreshData();
    if (location.state && (location.state as any).tab) {
        setActiveTab((location.state as any).tab);
    }
  }, [location]);

  const refreshData = () => {
    setInventoryItems(db.getInventoryItems());
    setProducts(db.getProducts());
  };

  const filteredInternal = inventoryItems.filter(item => 
      item.category === activeTab && 
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInternalSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentInternal.name) return;

      const item: InventoryItem = {
          id: currentInternal.id || `inv${Date.now()}`,
          name: currentInternal.name,
          category: activeTab as InventoryCategory,
          quantity: Number(currentInternal.quantity),
          description: currentInternal.description || '',
          location: currentInternal.location || '',
          purchaseDate: currentInternal.purchaseDate,
          warranty: currentInternal.warranty,
          unitCost: Number(currentInternal.unitCost) || 0
      };

      db.saveInventoryItem(item);
      refreshData();
      setIsModalOpen(false);
      setCurrentInternal({ name: '', category: activeTab as InventoryCategory, quantity: 0, description: '', location: '', purchaseDate: '', warranty: '', unitCost: 0 });
  };

  const handleEditInternal = (item: InventoryItem) => {
      setCurrentInternal(item);
      setIsModalOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.name) return;

    const product: Product = {
      id: currentProduct.id || `p${Date.now()}`,
      name: currentProduct.name,
      sku: currentProduct.sku || '',
      description: currentProduct.description || '',
      price: Number(currentProduct.price),
      cost: Number(currentProduct.cost),
      stock: Number(currentProduct.stock),
      active: currentProduct.active !== undefined ? currentProduct.active : true
    };

    db.saveProduct(product);
    refreshData();
    setIsModalOpen(false);
    setCurrentProduct({ name: '', sku: '', description: '', price: 0, cost: 0, stock: 0, active: true });
  };

  const handleEditProduct = (product: Product) => {
      setCurrentProduct(product);
      setIsModalOpen(true);
  };

  const openNewModal = () => {
      if (activeTab === 'Productos para la Venta') {
          setCurrentProduct({ name: '', sku: '', description: '', price: 0, cost: 0, stock: 0, active: true });
      } else {
          setCurrentInternal({ name: '', category: activeTab as InventoryCategory, quantity: 0, description: '', location: '', purchaseDate: '', warranty: '', unitCost: 0 });
      }
      setIsModalOpen(true);
  };

  // --- COLORFUL TABS CONFIG ---
  const tabConfig = [
      { id: 'Insumos', label: 'Insumos', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-700', activeColor: 'bg-emerald-500 text-white shadow-md shadow-emerald-200' },
      { id: 'Equipo de Oficina', label: 'Equipo de Oficina', icon: Monitor, color: 'bg-blue-100 text-blue-700', activeColor: 'bg-blue-600 text-white shadow-md shadow-blue-200' },
      { id: 'Herramientas', label: 'Herramientas', icon: Wrench, color: 'bg-orange-100 text-orange-700', activeColor: 'bg-orange-500 text-white shadow-md shadow-orange-200' },
      { id: 'Productos para la Venta', label: 'Productos (Venta)', icon: ShoppingBag, color: 'bg-violet-100 text-violet-700', activeColor: 'bg-violet-600 text-white shadow-md shadow-violet-200' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Control de Inventarios</h1>
            <p className="text-slate-500 mt-1">Gestión centralizada de activos fijos, consumibles y stock comercial.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-brand-500 transition-colors" />
             <input 
               className="pl-10 pr-4 py-2.5 border-none bg-white rounded-xl text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all w-64"
               placeholder={`Buscar en ${activeTab}...`}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={openNewModal}
            className="flex items-center px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 text-sm font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'Productos para la Venta' ? 'Nuevo Producto' : 'Nuevo Item'}
          </button>
        </div>
      </div>

      {/* Modern Colorful Tabs */}
      <div className="flex flex-wrap gap-4 pb-2">
        {tabConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
                <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as Tab); setSearchTerm(''); }}
                    className={`flex items-center px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-[1.02] ${
                        isActive ? tab.activeColor : `${tab.color} opacity-70 hover:opacity-100`
                    }`}
                >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                </button>
            )
        })}
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre / Código</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Detalles</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {activeTab === 'Productos para la Venta' ? 'Precio Venta' : 'Ubicación'}
                    </th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {activeTab === 'Productos para la Venta' ? 'Costo' : 'Costo Unit.'}
                    </th>
                    {activeTab === 'Equipo de Oficina' && (
                        <>
                            <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Compra</th>
                            <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Garantía</th>
                        </>
                    )}
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Existencia</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {activeTab === 'Productos para la Venta' ? (
                    filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-lg">
                                        {product.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{product.name}</p>
                                        <p className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-0.5">{product.sku}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{product.description}</td>
                            <td className="px-6 py-4">
                                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">Q{product.price.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-500">Q{(product.cost || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.stock > 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.stock} Units
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleEditProduct(product)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all"><Edit size={18}/></button>
                            </td>
                        </tr>
                    ))
                ) : (
                    filteredInternal.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${
                                        activeTab === 'Insumos' ? 'bg-emerald-50 text-emerald-600' : 
                                        activeTab === 'Herramientas' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        <Package size={20} />
                                    </div>
                                    <p className="font-bold text-slate-800">{item.name}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{item.description}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Box size={14} className="text-slate-400"/>
                                {item.location || 'No especificada'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-500">Q{(item.unitCost || 0).toLocaleString()}</td>
                            
                            {activeTab === 'Equipo de Oficina' && (
                                <>
                                    <td className="px-6 py-4 text-sm text-slate-600">{item.purchaseDate || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{item.warranty || '-'}</td>
                                </>
                            )}

                            <td className="px-6 py-4 text-center">
                                <span className="font-bold text-slate-800">{item.quantity}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleEditInternal(item)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all"><Edit size={18}/></button>
                            </td>
                        </tr>
                    ))
                )}
                {((activeTab === 'Productos para la Venta' && filteredProducts.length === 0) ||
                  (activeTab !== 'Productos para la Venta' && filteredInternal.length === 0)) && (
                    <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center">
                                <Box size={48} className="text-slate-200 mb-3" />
                                <p>No hay items registrados en esta categoría.</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Improved Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {activeTab === 'Productos para la Venta' 
                            ? (currentProduct.id ? 'Editar Producto' : 'Registrar Nuevo Producto')
                            : (currentInternal.id ? 'Editar Item' : 'Registrar Nuevo Item')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-bold">{activeTab}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
             </div>
             
             {activeTab === 'Productos para la Venta' ? (
                 <form onSubmit={handleProductSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre del Producto</label>
                        <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">SKU / Código</label>
                            <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none" value={currentProduct.sku} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Stock Inicial</label>
                            <input type="number" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none" value={currentProduct.stock} onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Descripción</label>
                        <textarea className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none h-24 resize-none" value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Precio Venta</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Q</span>
                                <input required type="number" className="w-full pl-8 border border-slate-200 rounded-lg py-2 bg-white font-bold text-slate-800" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Costo</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Q</span>
                                <input type="number" className="w-full pl-8 border border-slate-200 rounded-lg py-2 bg-white font-medium text-slate-600" value={currentProduct.cost || 0} onChange={e => setCurrentProduct({...currentProduct, cost: Number(e.target.value)})} />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2">
                            <Save size={18} /> Guardar Producto
                        </button>
                    </div>
                 </form>
             ) : (
                 <form onSubmit={handleInternalSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre del Item</label>
                        <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none" value={currentInternal.name} onChange={e => setCurrentInternal({...currentInternal, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Cantidad</label>
                            <input type="number" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none" value={currentInternal.quantity} onChange={e => setCurrentInternal({...currentInternal, quantity: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Ubicación</label>
                            <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none" placeholder="Ej. Bodega" value={currentInternal.location} onChange={e => setCurrentInternal({...currentInternal, location: e.target.value})} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Costo Unitario (Q)</label>
                        <input type="number" step="0.01" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none" value={currentInternal.unitCost || 0} onChange={e => setCurrentInternal({...currentInternal, unitCost: Number(e.target.value)})} />
                    </div>

                    {activeTab === 'Equipo de Oficina' && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <div>
                                <label className="block text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1"><Calendar size={12}/> Fecha Compra</label>
                                <input type="date" className="w-full border border-blue-200 rounded-lg p-2 bg-white text-sm" value={currentInternal.purchaseDate || ''} onChange={e => setCurrentInternal({...currentInternal, purchaseDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1"><ShieldCheck size={12}/> Garantía</label>
                                <input type="text" className="w-full border border-blue-200 rounded-lg p-2 bg-white text-sm" placeholder="Ej. 1 Año" value={currentInternal.warranty || ''} onChange={e => setCurrentInternal({...currentInternal, warranty: e.target.value})} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Descripción</label>
                        <textarea className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 outline-none h-20 resize-none" value={currentInternal.description} onChange={e => setCurrentInternal({...currentInternal, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2">
                            <Save size={18} /> Guardar Item
                        </button>
                    </div>
                 </form>
             )}
          </div>
        </div>
      )}
    </div>
  );
};