
import { proxy } from 'valtio';

export const state = proxy({
  selectedPattern: 'grub',  // Default pattern
});
