import { NavLink } from "react-router-dom";
import { APP_NAME } from "@/utils/constants";
import { Mail, Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary">{APP_NAME}</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Engineered for deep focus and community accountability. Built by students, for students.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <NavLink to="/about" className="hover:text-primary transition-colors">About Us</NavLink>
              </li>
              <li>
                <NavLink to="/legal" className="hover:text-primary transition-colors">Legal & Privacy</NavLink>
              </li>
              <li>
                <NavLink to="/auth" className="hover:text-primary transition-colors">Join Community</NavLink>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:administrator@onlyfocus.site" className="hover:text-primary transition-colors">
                  administrator@onlyfocus.site
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;