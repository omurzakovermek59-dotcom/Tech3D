import { useState } from 'react';
import { fmt, memToStr, Store } from '../../data.js';
import { EMPTY_PRODUCT } from '../../admin/constants.js';
import ProductDialog from './ProductDialog.jsx';
import { useLanguage } from '../../i18n/language.jsx';

export default function Products({ products, onSave, onToast }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(null);
  const edit = product => setEditing(product
    ? { ...product, old: product.old || '', mem: memToStr(product.mem), color1: product.c[0], color2: product.c[1], image: product.image || '' }
    : { ...EMPTY_PRODUCT });
  const save = product => {
    const list = Store.products();
    const index = list.findIndex(item => item.id === product.id);
    if (index === -1) list.push(product);
    else list[index] = product;
    Store.saveProducts(list);
    onSave(list);
    setEditing(null);
    onToast(t('admin.productSaved'));
  };
  const remove = product => {
    if (!window.confirm(t('admin.deleteProductConfirm'))) return;
    const list = Store.products().filter(item => item.id !== product.id);
    Store.saveProducts(list);
    onSave(list);
    onToast(t('admin.productDeleted'));
  };
  return <section>
    <div className="bar"><h2>{t('admin.products')}</h2><button className="btn" onClick={() => edit(null)}>+ {t('admin.newProduct')}</button></div>
    <div className="tbl glass"><table><thead><tr><th>{t('admin.name')}</th><th>{t('admin.brand')}</th><th>{t('admin.price')}</th><th>{t('admin.oldPrice')}</th><th>{t('admin.stock')}</th><th /></tr></thead>
      <tbody>{products.map(product => <tr key={product.id}>
        <td><b>{product.name}</b><br /><small>{memToStr(product.mem)}</small></td><td>{product.brand}</td><td>{fmt(product.base)}</td><td>{product.old ? fmt(product.old) : '—'}</td>
        <td className={product.stock <= 3 ? 'st-cancel' : ''}>{product.stock}</td>
        <td><button className="mbtn" onClick={() => edit(product)}>{t('admin.edit')}</button><button className="mbtn del" onClick={() => remove(product)}>{t('admin.delete')}</button></td>
      </tr>)}</tbody>
    </table></div>
    <ProductDialog key={editing?.id ?? (editing ? 'new' : 'closed')} value={editing} onClose={() => setEditing(null)} onSave={save} />
  </section>;
}
