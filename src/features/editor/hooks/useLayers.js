import { useSelector } from 'react-redux';
import { selectLayerList } from '@/store/selectors';

export const useLayers = () => useSelector(selectLayerList);

export default useLayers;
