import { useSelector } from 'react-redux';
import { selectSelectedIds } from '@/store/selectors';

export const useSelection = () => useSelector(selectSelectedIds);

export default useSelection;
