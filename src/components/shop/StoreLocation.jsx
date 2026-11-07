import { useEffect, useRef, useState } from 'react';
import { twoGisApiKey } from '../../firebase.js';
import { useLanguage } from '../../i18n/language.jsx';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber, whatsappUrl } from '../../utils/phone.js';

function isValidCoordinate(value, minimum, maximum) {
  const coordinate = Number(value);
  return value !== '' && Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum;
}

function loadMapGL() {
  if (window.mapgl?.Map) return Promise.resolve(window.mapgl);
  return new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-2gis-mapgl]');
    const loaded = () => window.mapgl?.Map
      ? resolve(window.mapgl)
      : reject(new Error('2GIS MapGL did not initialize.'));
    const failed = () => reject(new Error('Unable to load 2GIS MapGL.'));
    if (script) {
      script.addEventListener('load', loaded, { once: true });
      script.addEventListener('error', failed, { once: true });
      return;
    }
    script = document.createElement('script');
    script.dataset['2gisMapgl'] = 'true';
    script.src = `https://mapgl.2gis.com/api/js/v1?key=${encodeURIComponent(twoGisApiKey)}`;
    script.async = true;
    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', failed, { once: true });
    document.head.appendChild(script);
  });
}

export default function StoreLocation({ settings = {}, settingsError = '' }) {
  const { t } = useLanguage();
  const mapContainer = useRef(null);
  const [mapError, setMapError] = useState(false);
  const hasCoordinates = isValidCoordinate(settings.latitude, -90, 90)
    && isValidCoordinate(settings.longitude, -180, 180);
  const latitude = Number(settings.latitude);
  const longitude = Number(settings.longitude);
  const mapUrl = /^https:\/\/([a-z0-9-]+\.)*2gis\.(kg|com|ru)(\/|$)/i.test(settings.mapUrl || '')
    ? settings.mapUrl
    : hasCoordinates ? `https://2gis.kg/?m=${longitude},${latitude}/16` : '';
  const directionsUrl = hasCoordinates
    ? `https://2gis.kg/directions/points/${longitude},${latitude}`
    : '';
  const phone = normalizePhoneNumber(settings.phone);
  const whatsappNumber = isValidPhoneNumber(settings.whatsappNumber) ? settings.whatsappNumber : settings.phone;
  const formattedPhone = formatPhoneNumber(settings.phone);
  const formattedWhatsapp = formatPhoneNumber(whatsappNumber);
  const whatsappLink = whatsappUrl(whatsappNumber);

  useEffect(() => {
    setMapError(false);
    if (!twoGisApiKey || !hasCoordinates || !mapContainer.current) return undefined;
    let active = true;
    let map;
    loadMapGL().then(mapgl => {
      if (!active || !mapContainer.current) return;
      map = new mapgl.Map(mapContainer.current, {
        center: [longitude, latitude],
        zoom: 16
      });
      map.on?.('error', error => {
        console.error('2GIS map reported an error:', error);
        if (active) setMapError(true);
      });
      new mapgl.Marker(map, { coordinates: [longitude, latitude] });
    }).catch(error => {
      console.error('Unable to display 2GIS map:', error);
      if (active) setMapError(true);
    });
    return () => {
      active = false;
      map?.destroy();
    };
  }, [hasCoordinates, latitude, longitude]);

  return <section className="store-location" aria-labelledby="store-location-title">
    <h4 id="store-location-title">{t('footer.contact')}</h4>
    <div className="store-location-details">
      <p><b>{settings.name || t('location.namePending')}</b></p>
      <p>{t('location.address')}: {settings.address || t('location.addressPending')}</p>
      {phone && <p>{t('footer.phone')}: <a href={`tel:${phone}`}>{formattedPhone}</a></p>}
      {whatsappLink && <p>WhatsApp: <a href={whatsappLink} target="_blank" rel="noopener noreferrer">{formattedWhatsapp}</a></p>}
      <div className="location-links">
        {mapUrl && <a className="text-button" href={mapUrl} target="_blank" rel="noopener noreferrer">{t('location.openMap')}</a>}
        {directionsUrl && <a className="text-button" href={directionsUrl} target="_blank" rel="noopener noreferrer">{t('location.directions')}</a>}
      </div>
    </div>
    {settingsError && <p className="err" role="alert">{settingsError}</p>}
    {!settings.address && <p className="note">{t('location.placeholder')}</p>}
    {hasCoordinates && twoGisApiKey
      ? <div className="store-map-wrap">
        <div className="store-map" ref={mapContainer} aria-label={t('location.mapLabel')} />
        {mapError && <p className="note" role="alert">{t('location.mapError')}</p>}
      </div>
      : <div className="store-map-placeholder" role="status">
        {hasCoordinates ? t('location.apiKeyMissing') : t('location.coordinatesPending')}
      </div>}
  </section>;
}
