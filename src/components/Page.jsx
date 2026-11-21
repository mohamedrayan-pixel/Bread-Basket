import Navbar from './Navbar';
import { Footer, Floaters } from './Footer';

/** Layout for every inner page (normal orange branding, no Christmas decorations). */
export default function Page({ children }) {
  return (<><Navbar /><main className="pt-16">{children}</main><Footer /><Floaters /></>);
}
