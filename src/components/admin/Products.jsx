import { useState } from 'react';
import { fmt, memToStr } from '../../data.js';
import { EMPTY_PRODUCT } from '../../admin/constants.js';
import { deleteAdminProduct, saveAdminProduct } from '../../services/store.js';
import ProductDialog from './ProductDialog.jsx';
import { useLanguage } from '../../i18n/language.jsx';

export default function Products({ products, onSave, onToast }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(null);
  const productList = Array.isArray(products) ? products : [];
  const edit = product => setEditing(product
    ? {
      ...product,
      category: product.category || product.brand,
      old: product.old || '',
      mem: memToStr(Array.isArray(product.mem) ? product.mem : product.memoryVariants),
      color1: product.c?.[0] || '#7a3cff',
      color2: product.c?.[1] || '#22e4ff',
      image: product.image || '',
      gallery: Array.isArray(product.gallery) ? product.gallery : [],
      colors: Array.isArray(product.colors) ? product.colors.map(color => {
        const images = Array.isArray(color.images)
          ? color.images
          : color.image ? [color.image] : [];
        return {
          name: color.name || '',
          hex: color.hex || color.value || '#777777',
          images,
          mainImage: color.mainImage || color.image || images[0] || ''
        };
      }) : [],
      specs: { ram: '', storage: '', screen: '', camera: '', battery: '', processor: '', ...product.specs },
      modelUrl: product.modelUrl || ''
    }
    : { ...EMPTY_PRODUCT });
  const save = async product => {
    try {
      const saved = await saveAdminProduct(product);
      const list = [...productList.filter(item => item.id !== saved.id), saved];
      onSave(list);
      setEditing(null);
      onToast(t('admin.productSaved'));
      return true;
    } catch (error) {
      console.error('Unable to save product:', error);
      const code = error?.code ? ` (${error.code})` : '';
      const message = `${error?.message || t('admin.productSaveFailed')}${code}`;
      onToast(`${t('admin.productSaveFailed')} ${message}`.trim());
      return message;
    }
  };
  const remove = async product => {
    if (!window.confirm(t('admin.deleteProductConfirm'))) return;
    try {
      await deleteAdminProduct(product.id);
      onSave(productList.filter(item => item.id !== product.id));
      onToast(t('admin.productDeleted'));
    } catch (error) {
      console.error('Unable to delete product:', error);
      onToast(t('admin.productDeleteFailed'));
    }
  };
  return <section>
    <div className="bar"><h2>{t('admin.products')}</h2><button className="btn" onClick={() => edit(null)}>+ {t('admin.newProduct')}</button></div>
    <div className="tbl glass"><table><thead><tr><th>{t('admin.name')}</th><th>{t('admin.brand')}</th><th>{t('admin.price')}</th><th>{t('admin.oldPrice')}</th><th>{t('admin.stock')}</th><th /></tr></thead>
      <tbody>{productList.map(product => <tr key={product.id}>
        <td><b>{product.name}</b><br /><small>{memToStr(product.mem)}</small></td><td>{product.brand}</td><td>{fmt(product.base)}</td><td>{product.old ? fmt(product.old) : '—'}</td>
        <td className={product.stock <= 3 ? 'st-cancel' : ''}>{product.stock}</td>
        <td><button className="mbtn" onClick={() => edit(product)}>{t('admin.edit')}</button><button className="mbtn del" onClick={() => remove(product)}>{t('admin.delete')}</button></td>
      </tr>)}</tbody>
    </table></div>
    <ProductDialog key={editing?.id ?? (editing ? 'new' : 'closed')} value={editing} onClose={() => setEditing(null)} onSave={save} />
  </section>;
}
