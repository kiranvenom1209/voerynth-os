import React from 'react';
import {
  Home, DoorOpen, DoorClosed, Bed, Utensils, Sofa, Bath, Car,
  Tv, Briefcase, Dumbbell, Trees, Sun, Moon, Lightbulb, Lock,
  Thermometer, Wind, Droplet, Zap, Wifi, Camera, Speaker, Music,
  Coffee, Book, Gamepad2, Baby, Dog, Cat, Flower, Leaf, Sprout,
  Warehouse, Building, Store, School, Hospital,
  MapPin, Globe, Mountain, Waves, Flame, Snowflake,
  Cloud, CloudRain, CloudSnow, CloudLightning, Umbrella, Heart,
  Star, Shield, Key, Bell, Clock, Calendar, Mail, Phone, Smartphone,
  Laptop, Monitor, Printer, HardDrive, Database, Server, Cpu,
  Battery, BatteryCharging, Plug, Power, Settings, Wrench,
  Hammer, Scissors, Video, Mic,
  Headphones, Radio, Disc
} from 'lucide-react';

/**
 * Map MDI icon names to Lucide React components
 * @param {string} mdiIcon - MDI icon name (e.g., "mdi:door-sliding-lock")
 * @param {object} props - Props to pass to the icon component
 * @returns {JSX.Element} Lucide icon component
 */
export const getMdiIcon = (mdiIcon, props = {}) => {
  if (!mdiIcon) return <Home {...props} />;
  
  // Remove "mdi:" prefix if present
  const iconName = mdiIcon.replace(/^mdi:/, '').toLowerCase();
  
  // Icon mapping from MDI to Lucide
  const iconMap = {
    // Doors & Locks
    'door-sliding-lock': DoorClosed,
    'door-sliding': DoorOpen,
    'door-open': DoorOpen,
    'door-closed': DoorClosed,
    'door': DoorClosed,
    'lock': Lock,
    'lock-open': Lock,
    
    // Rooms
    'home': Home,
    'home-outline': Home,
    'bed': Bed,
    'silverware-fork-knife': Utensils,
    'food-fork-drink': Utensils,
    'sofa': Sofa,
    'bathtub': Bath,
    'shower': Bath,
    'car': Car,
    'garage': Warehouse,
    'television': Tv,
    'briefcase': Briefcase,
    'dumbbell': Dumbbell,
    'tree': Trees,
    'office-building': Building,
    'store': Store,
    'school': School,
    'hospital': Hospital,
    
    // Lighting
    'lightbulb': Lightbulb,
    'lightbulb-outline': Lightbulb,
    'lamp': Lightbulb,
    'ceiling-light': Lightbulb,
    'floor-lamp': Lightbulb,
    
    // Climate
    'thermometer': Thermometer,
    'fan': Wind,
    'air-conditioner': Wind,
    'radiator': Thermometer,
    'water-percent': Droplet,
    'water': Droplet,
    
    // Weather
    'weather-sunny': Sun,
    'weather-night': Moon,
    'weather-cloudy': Cloud,
    'weather-rainy': CloudRain,
    'weather-snowy': CloudSnow,
    'weather-lightning': CloudLightning,
    'umbrella': Umbrella,

    // Electronics
    'tv': Tv,
    'laptop': Laptop,
    'monitor': Monitor,
    'cellphone': Smartphone,
    'phone': Phone,
    'speaker': Speaker,
    'headphones': Headphones,
    'radio': Radio,
    'camera': Camera,
    'video': Video,
    'microphone': Mic,
    
    // Energy
    'flash': Zap,
    'lightning-bolt': Zap,
    'power-plug': Plug,
    'power': Power,
    'battery': Battery,
    'battery-charging': BatteryCharging,
    
    // Network
    'wifi': Wifi,
    'router': Wifi,
    'lan': Wifi,
    
    // Nature
    'flower': Flower,
    'leaf': Leaf,
    'sprout': Sprout,
    'pine-tree': Trees,
    'dog': Dog,
    'cat': Cat,
    'paw': Dog,
    
    // Entertainment
    'gamepad': Gamepad2,
    'controller': Gamepad2,
    'music': Music,
    'disc': Disc,
    'film': Video,
    'book': Book,
    'book-open': Book,
    
    // Kitchen
    'coffee': Coffee,
    'coffee-maker': Coffee,
    'kettle': Coffee,
    
    // Baby
    'baby': Baby,
    'baby-carriage': Baby,
    
    // Locations
    'map-marker': MapPin,
    'map-marker-outline': MapPin,
    'earth': Globe,
    'mountain': Mountain,
    'waves': Waves,
    
    // Misc
    'fire': Flame,
    'snowflake': Snowflake,
    'heart': Heart,
    'star': Star,
    'shield': Shield,
    'key': Key,
    'bell': Bell,
    'clock': Clock,
    'calendar': Calendar,
    'email': Mail,
    'settings': Settings,
    'cog': Settings,
    'tools': Wrench,
    'wrench': Wrench,
    'hammer': Hammer,
  };
  
  const IconComponent = iconMap[iconName] || Home;
  return <IconComponent {...props} />;
};

export default getMdiIcon;

