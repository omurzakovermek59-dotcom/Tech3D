import { useEffect, useRef, useState } from 'react';
import { strToMem } from '../../data.js';
import { useLanguage } from '../../i18n/language.jsx';

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(source);
      try {
        let scale = Math.min(1, 1000 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas is unavailable'));
          return;
        }
        for (let attempt = 0; attempt < 5; attempt += 1) {
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const result = canvas.toDataURL('image/webp', 0.78 - attempt * 0.08);
          if (!result.startsWith('data:image/webp')) {
            reject(new Error('WebP encoding is unavailable'));
            return;
          }
          if (result.length <= 450000) {
            resolve(result);
            return;
          }
          scale *= 0.8;
        }
        reject(new Error('Compressed image exceeds the storage limit'));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error('Image could not be loaded'));
    };
    image.src = source;
  });
}

export default function ProductDialog({ value, onClose, onSave }) {
  const { t } = useLanguage();
  const dialog = useRef(null);
  const [form, setForm] = useState(value);
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    if (!value) return;
    setForm(value);
    setImageError(false);
    if (!dialog.current.open) dialog.current.showModal();
  }, [value]);
  if (!value) return null;
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const chooseImage = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(false);
    try {
      const image = await compressImage(file);
      setForm(current => ({ ...current, image }));
    } catch (error) {
      console.error('Unable to process product image:', error);
      setImageError(true);
    }
    event.target.value = '';
  };
  const removeImage = () => setForm(current => ({ ...current, image: '' }));
  const close = () => {
    dialog.current.close();
    onClose();
  };
  const submit = async event => {
    event.preventDefault();
    const saved = await onSave({
      id: form.id || `p${Date.now().toString(36)}`,
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim() || form.brand.trim(),
      desc: form.desc.trim(),
      image: form.image || '',
      modelUrl: form.modelUrl.trim(),
      base: Number(form.base),
      old: Number(form.old) || 0,
      stock: Math.max(0, Number.parseInt(form.stock, 10) || 0),
      mem: strToMem(form.mem),
      c: [form.color1, form.color2]
    });
    if (saved !== false) close();
  };
  return <dialog className="glass modal" ref={dialog} onCancel={onClose}>
    <form onSubmit={submit}>
      <h3>{form.id ? t('admin.editProduct') : t('admin.newProduct')}</h3>
      <label>{t('admin.name')}<input name="name" value={form.name} onChange={update} required /></label>
      <label>{t('admin.brand')}<input name="brand" value={form.brand} onChange={update} required placeholder="Apple, Samsung..." /></label>
      <label>{t('admin.category')}<input name="category" value={form.category || ''} onChange={update} required /></label>
      <label>{t('admin.description')}<input name="desc" value={form.desc} onChange={update} /></label>
      <label>{t('admin.modelUrl')}<input name="modelUrl" type="url" value={form.modelUrl || ''} onChange={update} placeholder="https://example.com/model.glb" /></label>
      <label className="image-upload">{t('admin.productImage')}<input type="file" accept="image/*" onChange={chooseImage} /></label>
      {form.image && <div className="image-preview-wrap">
        <img className="image-preview" src={form.image} alt={form.name || t('admin.productImage')} />
        <button type="button" className="mbtn del" onClick={removeImage}>{t('admin.removeImage')}</button>
      </div>}
      {imageError && <p className="err" role="alert">{t('admin.imageTooLarge')}</p>}
      <div className="row2">
        <label>{t('admin.priceSom')}<input name="base" type="number" min="0" value={form.base} onChange={update} required /></label>
        <label>{t('admin.oldPriceSom')}<input name="old" type="number" min="0" value={form.old} onChange={update} /></label>
      </div>
      <label>{t('admin.stockCount')}<input name="stock" type="number" min="0" value={form.stock} onChange={update} required /></label>
      <label>{t('admin.memoryPrices')}<input name="mem" value={form.mem} onChange={update} placeholder="256ГБ:0, 512ГБ:20000" /></label>
      <div className="row2">
        <label>{t('admin.color1')}<input name="color1" type="color" value={form.color1} onChange={update} /></label>
        <label>{t('admin.color2')}<input name="color2" type="color" value={form.color2} onChange={update} /></label>
      </div>
      <div className="row2"><button type="button" className="btn ghost" onClick={close}>{t('admin.cancel')}</button><button className="btn">{t('admin.save')}</button></div>
    </form>
  </dialog>;
}
