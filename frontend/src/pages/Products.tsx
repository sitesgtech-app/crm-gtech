
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Product, User } from '../types';
import { Plus, Search, Edit, Package, Save, X } from 'lucide-react';

export const Products: React.FC<{ user: User }> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '', sku: '', description: '', price: 0, stock: 0, active: true
  });

  useEffect(() => {
    setProducts(db.getProducts());
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
      setCurrentProduct(product);
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.name) return;

    const product: Product = {
      id: currentProduct.id || `p${Date.now()}`,
      name: currentProduct.name,
      sku: currentProduct.sku || '',
      description: currentProduct.description || '',
      price: Number(currentProduct.price),
      stock: Number(currentProduct.stock),
      active: currentProduct.active !== undefined ? currentProduct.active : true
    };

    db.saveProduct(product);
    setProducts(db.getProducts());
    setIsModalOpen(false);
    setCurrentProduct({ name: '', sku: '', description: '', price: 0, stock: 0, active: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Inventario de Productos</h1>
            <p className="text-slate-500 text-sm">Administra el catálogo de productos físicos.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
               placeholder="Buscar producto..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={() => { setCurrentProduct({ name: '', sku: '', description: '', price: 0, stock: 0, active: true }); setIsModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">SKU</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Producto</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Descripción</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Precio (Q)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {product.sku}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                          <Package size={16} />
                      </div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {product.description}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">
                   Q{product.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {product.stock}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(product)} className="text-slate-400 hover:text-brand-600 transition-colors">
                      <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between">
              <h2 className="text-xl font-bold text-slate-800">{currentProduct.id ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Código</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentProduct.sku} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial</label>
                    <input type="number" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentProduct.stock} onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea className="w-full border border-slate-300 rounded-lg p-2 h-20 bg-white" value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Unitario (Q)</label>
                <input required type="number" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2">
                    <Save size={16} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
