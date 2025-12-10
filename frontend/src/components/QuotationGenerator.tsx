
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Save, FileText, EyeOff, Eye, Upload, Download, RefreshCw } from 'lucide-react';
import { Opportunity, Client, User, Quotation, QuotationItem, Organization } from '../types';
import { db } from '../services/db';

interface QuotationGeneratorProps {
    opportunity: Opportunity;
    client: Client | undefined;
    user: User;
    onClose: () => void;
    onSave: (quotation: Quotation) => void;
}

export const QuotationGenerator: React.FC<QuotationGeneratorProps> = ({ opportunity, client, user, onClose, onSave }) => {
    // Initial State Setup
    const [quotationNumber, setQuotationNumber] = useState(`ER-${Math.floor(1000 + Math.random() * 9000)}`);
    const [date, setDate] = useState(new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' }));
    const [sectionTitle, setSectionTitle] = useState('Monitores');
    const [org, setOrg] = useState<Organization | null>(null);
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const [showLogo, setShowLogo] = useState(true);

    const [clientInfo, setClientInfo] = useState({
        name: client?.company || client?.name || 'Cliente General',
        department: 'Departamento de Compras',
        nit: client?.nit || '',
        address: client?.address || 'Ciudad de Guatemala',
        phone: client?.phone || ''
    });

    const [items, setItems] = useState<QuotationItem[]>([
        { id: '1', description: opportunity.description || 'Descripción del producto...', quantity: 1, unitPrice: opportunity.amount || 0, total: opportunity.amount || 0 }
    ]);

    const [totalInLetters, setTotalInLetters] = useState('');

    const [observations, setObservations] = useState<string[]>([
        'Precios incluyen IVA.',
        'SUJETO A RETENCIÓN DEFINITIVA (Régimen Opcional Simplificado).',
        'Cotización válida por 30 días.',
        'Tiempo de Entrega: 10 días hábiles a partir de confirmación de O.C.',
        'Garantía: 2 años.',
        'Crédito mínimo de 30 días',
        'Forma de pago: Transferencia Bancaria',
    ]);

    const [images, setImages] = useState<string[]>([]);

    // External File State
    const [externalFile, setExternalFile] = useState<{ url: string, name: string } | null>(null);

    // Load Org Data
    useEffect(() => {
        setOrg(db.getOrganization());
    }, []);

    // Load existing quotation if available
    useEffect(() => {
        if (opportunity.quotation) {
            setQuotationNumber(opportunity.quotation.number);
            setDate(opportunity.quotation.date);
            setSectionTitle(opportunity.quotation.sectionTitle || 'Monitores');
            setClientInfo({
                name: opportunity.quotation.clientName,
                department: opportunity.quotation.clientDepartment,
                nit: opportunity.quotation.clientNit,
                address: opportunity.quotation.clientAddress,
                phone: opportunity.quotation.clientPhone || client?.phone || ''
            });
            setItems(opportunity.quotation.items);
            setTotalInLetters(opportunity.quotation.totalInLetters);
            setObservations(opportunity.quotation.observations);
            setImages(opportunity.quotation.images);

            if (opportunity.quotation.externalFile) {
                setExternalFile({
                    url: opportunity.quotation.externalFile,
                    name: opportunity.quotation.externalFileName || 'Cotización_Externa.pdf'
                });
            }
        }
    }, [opportunity]);

    // Calculations
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    const handleItemChange = (id: string, field: keyof QuotationItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updated.total = Number(updated.quantity) * Number(updated.unitPrice);
                }
                return updated;
            }
            return item;
        }));
    };

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleSave = () => {
        const quoteData: Quotation = {
            number: quotationNumber,
            date,
            sectionTitle,
            clientName: clientInfo.name,
            clientDepartment: clientInfo.department,
            clientNit: clientInfo.nit,
            clientAddress: clientInfo.address,
            clientPhone: clientInfo.phone,
            items,
            totalInLetters,
            observations,
            images,
            externalFile: externalFile?.url,
            externalFileName: externalFile?.name
        };
        onSave(quoteData);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExportWord = () => {
        const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Cotización</title></head>
      <body>
        <h1>${org?.name || 'Empresa'}</h1>
        <p>${org?.address} | NIT: ${org?.nit}</p>
        <br/>
        <table style="width:100%">
          <tr>
            <td>
              <strong>Cliente:</strong> ${clientInfo.name}<br/>
              <strong>NIT:</strong> ${clientInfo.nit}<br/>
              <strong>Dirección:</strong> ${clientInfo.address}
            </td>
            <td style="text-align:right">
              <strong>Cotización No:</strong> ${quotationNumber}<br/>
              <strong>Fecha:</strong> ${date}
            </td>
          </tr>
        </table>
        <br/>
        <h3>${sectionTitle}</h3>
        <table border="1" style="width:100%; border-collapse: collapse;">
          <tr style="background-color: #f0f0f0;">
            <th>Descripción</th><th>Cant.</th><th>Precio Unit.</th><th>Total</th>
          </tr>
          ${items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align:center">${item.quantity}</td>
              <td style="text-align:right">Q.${item.unitPrice.toFixed(2)}</td>
              <td style="text-align:right">Q.${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="3" style="text-align:right"><strong>TOTAL</strong></td>
            <td style="text-align:right"><strong>Q.${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
          </tr>
        </table>
        <br/>
        <p><strong>Total en letras:</strong> ${totalInLetters}</p>
        <br/>
        <h4>Observaciones:</h4>
        <ul>
          ${observations.map(obs => `<li>${obs}</li>`).join('')}
        </ul>
      </body>
      </html>
    `;

        const blob = new Blob(['\ufeff', content], {
            type: 'application/msword'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Cotizacion_${quotationNumber}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExternalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5000000) {
                alert('El archivo es demasiado grande. Máximo 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setExternalFile({
                    url: reader.result as string,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveExternalFile = () => {
        setExternalFile(null);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-start justify-center overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200 backdrop-blur-sm">
            <style>{`
        @media print {
            @page { size: A4 portrait; margin: 0; }
            body { -webkit-print-color-adjust: exact; }
        }
        /* Custom Scrollbar for Modal */
        .modal-scroll::-webkit-scrollbar { width: 8px; }
        .modal-scroll::-webkit-scrollbar-track { bg-transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>

            {/* Close Overlay Click Area */}
            <div className="absolute inset-0 w-full h-full" onClick={onClose}></div>

            <div className="relative bg-white w-[21cm] min-h-[29.7cm] shadow-2xl mx-auto flex flex-col print:shadow-none print:w-full my-8 md:my-10 scale-[0.85] md:scale-100 origin-top transition-transform duration-200">

                {externalFile ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50 border-2 border-dashed border-slate-300 m-8 rounded-xl">
                        <FileText size={64} className="text-brand-600 mb-4" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Cotización Externa Cargada</h2>
                        <p className="text-slate-500 mb-6">Esta oportunidad utiliza un archivo externo en lugar del generador automático.</p>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-4 mb-6 shadow-sm w-full max-w-md">
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                <FileText size={24} />
                            </div>
                            <div className="flex-1 truncate">
                                <p className="font-bold text-slate-800 text-sm truncate">{externalFile.name}</p>
                                <p className="text-xs text-slate-400">Documento reemplazo</p>
                            </div>
                            <a
                                href={externalFile.url}
                                download={externalFile.name}
                                className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                title="Descargar"
                            >
                                <Download size={20} />
                            </a>
                        </div>
                        <button
                            onClick={handleRemoveExternalFile}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold text-sm px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <RefreshCw size={16} /> Eliminar y Usar Generador
                        </button>
                    </div>
                ) : (
                    /* PDF Content */
                    <div className="p-10 md:p-14 text-slate-900 text-sm flex-1 flex flex-col font-sans bg-white">

                        {/* --- HEADER SECTION --- */}
                        <div className="flex justify-between items-start mb-12">
                            {/* Company Info (Left) - DYNAMIC FROM ORG */}
                            <div className="text-sm leading-tight text-slate-800">
                                <h1 className="font-bold text-base mb-1 font-lato">{org?.name || 'Empresa'}</h1>
                                <p className="font-medium">NIT. {org?.nit}</p>
                                <p>Razón Social | {org?.name}</p>
                                <p className="text-blue-700 hover:underline">{org?.email}</p>
                                <p className="text-blue-700 hover:underline mb-2">{org?.website}</p>
                                <p className="max-w-xs">{org?.address}</p>
                                <p className="font-medium">{org?.phone}</p>
                            </div>

                            {/* Logo (Right) - EDITABLE */}
                            <div className="text-right relative group">
                                {/* Logo Controls Overlay */}
                                <div className="absolute -top-8 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden bg-white/90 p-1 rounded shadow-sm border border-slate-200 z-10">
                                    <label className="cursor-pointer text-xs text-blue-600 hover:underline flex items-center">
                                        Cambiar
                                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                    </label>
                                    <button onClick={() => setShowLogo(!showLogo)} className="text-slate-400 hover:text-slate-600" title={showLogo ? "Ocultar Logo" : "Mostrar Logo"}>
                                        {showLogo ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>

                                {showLogo && (
                                    <div className="flex flex-col items-end">
                                        {customLogo || org?.logoUrl ? (
                                            <img src={customLogo || org?.logoUrl} alt="Logo" className="max-h-24 max-w-[150px] object-contain mb-1" />
                                        ) : (
                                            <div className="relative mb-1">
                                                <span className="font-sans text-[5rem] leading-none text-[#0e4e82] tracking-tighter font-light relative block font-lato" style={{ fontFamily: 'Arial, sans-serif' }}>
                                                    {org?.commercialName?.charAt(0) || 'G'}
                                                    <div className="absolute top-[10px] right-[-15px] w-6 h-6 rounded-full border-[3px] border-[#0e4e82]"></div>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- DATE & QUOTE NUMBER --- */}
                        <div className="flex flex-col items-end mb-8">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-base font-lato">Cotización No.</span>
                                <input
                                    type="text"
                                    value={quotationNumber}
                                    onChange={(e) => setQuotationNumber(e.target.value)}
                                    className="font-bold text-base text-right border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none w-32 bg-transparent print:border-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="text-right border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none w-64 bg-transparent print:border-none"
                                />
                            </div>
                        </div>

                        {/* --- CLIENT INFO SECTION --- */}
                        <div className="mb-8 text-sm">
                            <div className="mb-1 font-bold text-slate-800 font-lato">Señores</div>
                            <div className="pl-0 space-y-1">
                                <input
                                    type="text"
                                    value={clientInfo.name}
                                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                                    className="block w-full font-bold text-lg border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none bg-transparent print:border-none"
                                    placeholder="Nombre del Cliente"
                                />
                                <input
                                    type="text"
                                    value={clientInfo.department}
                                    onChange={(e) => setClientInfo({ ...clientInfo, department: e.target.value })}
                                    className="block w-full border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none bg-transparent print:border-none"
                                    placeholder="Departamento (Opcional)"
                                />

                                <div className="flex gap-2 pt-1">
                                    <span className="font-bold w-20 font-lato">NIT:</span>
                                    <input
                                        type="text"
                                        value={clientInfo.nit}
                                        onChange={(e) => setClientInfo({ ...clientInfo, nit: e.target.value })}
                                        className="flex-1 border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none bg-transparent print:border-none"
                                        placeholder="NIT"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <span className="font-bold w-20 font-lato">Dirección:</span>
                                    <input
                                        type="text"
                                        value={clientInfo.address}
                                        onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                                        className="flex-1 border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none bg-transparent print:border-none"
                                        placeholder="Dirección completa"
                                    />
                                </div>

                                {clientInfo.phone && (
                                    <div className="flex gap-2">
                                        <span className="font-bold w-20 font-lato">Teléfono:</span>
                                        <input
                                            type="text"
                                            value={clientInfo.phone}
                                            onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                                            className="flex-1 border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none bg-transparent print:border-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- ITEMS TABLE --- */}
                        <div className="mb-6">
                            {/* Editable Section Title */}
                            <div className="mb-2">
                                <input
                                    value={sectionTitle}
                                    onChange={(e) => setSectionTitle(e.target.value)}
                                    className="font-medium text-lg w-full text-center outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-500 bg-transparent print:border-none placeholder-slate-300 font-lato"
                                    placeholder="Título de Sección (ej. Monitores)"
                                />
                            </div>

                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-y border-black text-sm">
                                        <th className="py-2 text-center w-[50%] border-r border-black/10 font-bold font-lato">Descripción</th>
                                        <th className="py-2 text-center w-[15%] border-r border-black/10 font-bold font-lato">Cantidad</th>
                                        <th className="py-2 text-center w-[15%] border-r border-black/10 font-bold font-lato">Costo Unitario</th>
                                        <th className="py-2 text-center w-[15%] font-bold font-lato">Total</th>
                                        <th className="py-2 w-[5%] print:hidden"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className="group border-b border-slate-200 print:border-black/10">
                                            <td className="py-4 px-2 align-top border-r border-black/10">
                                                <textarea
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                    className="w-full min-h-[60px] resize-none outline-none bg-transparent font-sans text-sm bg-white"
                                                />
                                            </td>
                                            <td className="py-4 px-2 align-middle text-center border-r border-black/10">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                                    className="w-full text-center outline-none bg-transparent bg-white"
                                                />
                                            </td>
                                            <td className="py-4 px-2 align-middle text-center border-r border-black/10">
                                                <div className="flex justify-center items-center">
                                                    <span className="mr-1">Q.</span>
                                                    <input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                                                        className="w-20 text-right outline-none bg-transparent bg-white"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 align-middle text-center font-medium">
                                                Q.{item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-4 px-2 align-middle text-center print:hidden">
                                                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={5} className="pt-2 print:hidden">
                                            <button onClick={addItem} className="flex items-center gap-1 text-brand-600 text-xs hover:underline">
                                                <Plus size={14} /> Agregar Fila
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="border-t-2 border-black">
                                        <td colSpan={3} className="py-3 text-right font-bold pr-4 font-lato">TOTAL</td>
                                        <td className="py-3 text-center font-bold text-lg font-lato">
                                            Q.{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* --- TOTAL IN LETTERS --- */}
                        <div className="mb-8 flex gap-2 text-sm">
                            <span className="font-bold whitespace-nowrap font-lato">Total, en letras:</span>
                            <input
                                type="text"
                                value={totalInLetters}
                                onChange={(e) => setTotalInLetters(e.target.value)}
                                placeholder="(Ingrese el monto en letras aquí)"
                                className="w-full border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none bg-transparent print:border-none font-medium"
                            />
                        </div>

                        {/* --- OBSERVATIONS --- */}
                        <div className="mb-8">
                            <h4 className="font-bold text-sm mb-2 font-lato">Observaciones:</h4>
                            <ul className="list-disc pl-5 space-y-1 text-xs">
                                {observations.map((obs, index) => (
                                    <li key={index} className="group flex items-center gap-2">
                                        <span>{obs}</span>
                                        <button onClick={() => setObservations(observations.filter((_, i) => i !== index))} className="text-red-400 opacity-0 group-hover:opacity-100 print:hidden">
                                            <Trash2 size={12} />
                                        </button>
                                    </li>
                                ))}
                                <li className="list-none mt-2 print:hidden">
                                    <button
                                        onClick={() => {
                                            const newObs = prompt("Nueva observación:");
                                            if (newObs) setObservations([...observations, newObs]);
                                        }}
                                        className="text-brand-600 flex items-center gap-1 text-xs hover:underline"
                                    >
                                        <Plus size={12} /> Agregar Observación
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* --- SIGNATURE --- */}
                        <div className="mt-12 w-64">
                            <div className="text-center relative mb-2">
                                {/* Espacio vacío para firma manual */}
                                <div className="h-16 mx-auto"></div>
                            </div>
                            <div className="border-t border-black pt-2 text-center text-xs">
                                <p className="font-bold font-lato">{user.name}</p>
                                <p>Departamento de Ventas</p>
                                <p>{org?.name}</p>
                            </div>
                        </div>

                    </div>
                )}

                {/* Actions Toolbar (Floating or bottom) */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center print:hidden">
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-800 font-medium">Cancelar</button>
                    <div className="flex gap-3 items-center">
                        {!externalFile && (
                            <>
                                <label className="flex items-center px-4 py-2 border border-dashed border-slate-400 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-xs font-bold">
                                    <Upload className="w-4 h-4 mr-2" /> Reemplazar (Subir Archivo)
                                    <input type="file" accept="application/pdf,image/*,.doc,.docx" className="hidden" onChange={handleExternalFileUpload} />
                                </label>
                                <button onClick={handleExportWord} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-bold">
                                    <FileText className="w-4 h-4 mr-2" /> Descargar Word
                                </button>
                            </>
                        )}
                        <button onClick={handleSave} className="flex items-center px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-bold shadow-lg shadow-brand-500/30">
                            <Save className="w-4 h-4 mr-2" /> Guardar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
