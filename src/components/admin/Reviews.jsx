import { useCallback, useEffect, useState } from 'react';
import { deleteAdminReview, loadAllReviews } from '../../services/store.js';
import { useLanguage } from '../../i18n/language.jsx';

export default function Reviews({ onToast }) {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setReviews(await loadAllReviews());
      setError('');
    } catch (failure) {
      console.error('Unable to load reviews for moderation:', failure);
      setError(t('admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => { reload(); }, [reload]);
  const remove = async review => {
    if (!window.confirm(t('admin.deleteReviewConfirm'))) return;
    try {
      await deleteAdminReview(review);
      setReviews(current => current.filter(item => item.id !== review.id || item.productId !== review.productId));
      onToast(t('admin.reviewDeleted'));
    } catch (failure) {
      console.error('Unable to moderate review:', failure);
      onToast(t('admin.reviewDeleteFailed'));
    }
  };
  return <section>
    <div className="bar"><h2>{t('admin.reviews')}</h2><button className="btn ghost" onClick={reload}>{t('admin.refresh')}</button></div>
    {error && <p className="err" role="alert">{error}</p>}
    {loading ? <p className="note">{t('auth.loading')}</p> : reviews.length ? <div className="tbl glass"><table>
      <thead><tr><th>{t('admin.product')}</th><th>{t('admin.customer')}</th><th>{t('admin.rating')}</th><th>{t('admin.reviewText')}</th><th>{t('admin.date')}</th><th /></tr></thead>
      <tbody>{reviews.map(review => <tr key={`${review.productId}-${review.id}`}>
        <td>{review.productId}</td><td>{review.authorName || review.uid}</td><td>{review.rating} ★</td><td>{review.comment}</td>
        <td>{review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'ky-KG') : '—'}</td>
        <td><button className="mbtn del" onClick={() => remove(review)}>{t('admin.delete')}</button></td>
      </tr>)}</tbody>
    </table></div> : <p className="empty">{t('admin.noReviews')}</p>}
  </section>;
}
