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
  const chooseGallery = async event => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setImageError(false);
    try {
      const images = await Promise.all(files.map(compressImage));
      setForm(current => ({ ...current, gallery: [...(current.gallery || []), ...images] }));
    } catch (error) {
      console.error('Unable to process product gallery:', error);
      setImageError(true);
    }
    event.target.value = '';
  };
  const updateColor = (index, key, value) => setForm(current => ({
    ...current,
    colors: current.colors.map((color, colorIndex) => colorIndex === index ? { ...color, [key]: value } : color)
  }));
  const chooseColorImage = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(false);
    try {
      updateColor(index, 'image', await compressImage(file));
    } catch (error) {
      console.error('Unable to process product color image:', error);
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
      gallery: form.gallery || [],
      colors: (form.colors || []).filter(color => color.name?.trim()).map(color => ({
        name: color.name.trim(),
        value: color.value || '#777777',
        image: color.image || ''
      })),
      specs: Object.fromEntries(Object.entries(form.specs || {}).map(([key, value]) => [key, value.trim()])),
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
      <label className="image-upload">{t('location.galleryAdmin')}<input type="file" accept="image/*" multiple onChange={chooseGallery} /></label>
      {form.gallery?.length > 0 && <div className="admin-gallery-previews">{form.gallery.map((image, index) => <div className="admin-gallery-preview" key={`${image.slice(0, 40)}-${index}`}>
        <img src={image} alt={`${t('location.galleryAdmin')} ${index + 1}`} />
        <button type="button" className="mbtn del" onClick={() => setForm(current => ({ ...current, gallery: current.gallery.filter((_, itemIndex) => itemIndex !== index) }))}>{t('location.remove')}</button>
      </div>)}</div>}
      {imageError && <p className="err" role="alert">{t('admin.imageTooLarge')}</p>}
      <div className="row2">
        <label>{t('admin.priceSom')}<input name="base" type="number" min="0" value={form.base} onChange={update} required /></label>
        <label>{t('admin.oldPriceSom')}<input name="old" type="number" min="0" value={form.old} onChange={update} /></label>
      </div>
      <label>{t('admin.stockCount')}<input name="stock" type="number" min="0" value={form.stock} onChange={update} required /></label>
      <label>{t('admin.memoryPrices')}<input name="mem" value={form.mem} onChange={update} placeholder="256ГБ:0, 512ГБ:20000" /></label>
      <h4>{t('location.specifications')}</h4>
      {[
        ['ram', 'location.ram'],
        ['storage', 'location.storage'],
        ['screen', 'location.screen'],
        ['camera', 'location.camera'],
        ['battery', 'location.battery'],
        ['processor', 'location.processor']
      ].map(([key, label]) => <label key={key}>{t(label)}<input value={form.specs?.[key] || ''} onChange={event => setForm(current => ({ ...current, specs: { ...current.specs, [key]: event.target.value } }))} /></label>)}
      <div className="bar"><h4>{t('location.colors')}</h4><button type="button" className="mbtn" onClick={() => setForm(current => ({ ...current, colors: [...(current.colors || []), { name: '', value: '#777777', image: '' }] }))}>+ {t('location.addColor')}</button></div>
      {form.colors?.map((color, index) => <fieldset className="admin-color-fields" key={`color-${index}`}>
        <label>{t('location.colorName')}<input value={color.name} onChange={event => updateColor(index, 'name', event.target.value)} required /></label>
        <label>{t('location.color')}<input type="color" value={color.value || '#777777'} onChange={event => updateColor(index, 'value', event.target.value)} /></label>
        <label className="image-upload">{t('location.colorImage')}<input type="file" accept="image/*" onChange={event => chooseColorImage(index, event)} /></label>
        {color.image && <div className="image-preview-wrap">
          <img className="image-preview" src={color.image} alt={color.name || t('location.color')} />
          <button type="button" className="mbtn del" onClick={() => updateColor(index, 'image', '')}>{t('location.remove')}</button>
        </div>}
        <button type="button" className="mbtn del" onClick={() => setForm(current => ({ ...current, colors: current.colors.filter((_, itemIndex) => itemIndex !== index) }))}>{t('location.remove')}</button>
      </fieldset>)}
      <div className="row2">
        <label>{t('admin.color1')}<input name="color1" type="color" value={form.color1} onChange={update} /></label>
        <label>{t('admin.color2')}<input name="color2" type="color" value={form.color2} onChange={update} /></label>
      </div>
      <div className="row2"><button type="button" className="btn ghost" onClick={close}>{t('admin.cancel')}</button><button className="btn">{t('admin.save')}</button></div>
    </form>
  </dialog>;
}
