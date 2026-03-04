import React from 'react';
import * as LucideIcons from 'lucide-react';

// Destructure the icons we need
const {
  User, Users, UserCircle, Smile, Heart, Star, Zap, Crown,
  Sparkles, Coffee, Music, Headphones, Gamepad2, Book, Palette,
  Camera, Plane, Bike, Rocket, Trophy, Target, Flame, Sun,
  Moon, Cloud, Umbrella, Flower, Leaf, Trees, Cat, Dog, Bird,
  Fish, Bug, Squirrel, Rabbit, Turtle, Feather, Gem, Diamond,
  Circle, Square, Triangle, Hexagon, Octagon, Pentagon, Award,
  Medal, Shield, Key, Lock, Anchor, Compass, Map, Globe,
  Mountain, Waves, Wind, Snowflake, Droplet, Sunrise, Sunset
} = LucideIcons;

/**
 * Array of fun, colorful icons for person avatars
 */
export const PERSON_ICONS = [
  User, Users, UserCircle, Smile, Heart, Star, Zap, Crown,
  Sparkles, Coffee, Music, Headphones, Gamepad2, Book, Palette,
  Camera, Plane, Bike, Rocket, Trophy, Target, Flame, Sun,
  Moon, Cloud, Umbrella, Flower, Leaf, Trees, Cat, Dog, Bird,
  Fish, Bug, Squirrel, Rabbit, Turtle, Feather, Gem, Diamond,
  Circle, Square, Triangle, Hexagon, Octagon, Pentagon, Award,
  Medal, Shield, Key, Lock, Anchor, Compass, Map, Globe,
  Mountain, Waves, Wind, Snowflake, Droplet, Sunrise, Sunset
];

/**
 * Map of icon names to components for easy lookup
 */
export const ICON_NAME_MAP = {
  'User': User, 'Users': Users, 'UserCircle': UserCircle, 'Smile': Smile,
  'Heart': Heart, 'Star': Star, 'Zap': Zap, 'Crown': Crown,
  'Sparkles': Sparkles, 'Coffee': Coffee, 'Music': Music, 'Headphones': Headphones,
  'Gamepad2': Gamepad2, 'Book': Book, 'Palette': Palette, 'Camera': Camera,
  'Plane': Plane, 'Bike': Bike, 'Rocket': Rocket, 'Trophy': Trophy,
  'Target': Target, 'Flame': Flame, 'Sun': Sun, 'Moon': Moon,
  'Cloud': Cloud, 'Umbrella': Umbrella, 'Flower': Flower, 'Leaf': Leaf,
  'Trees': Trees, 'Cat': Cat, 'Dog': Dog, 'Bird': Bird,
  'Fish': Fish, 'Bug': Bug, 'Squirrel': Squirrel, 'Rabbit': Rabbit,
  'Turtle': Turtle, 'Feather': Feather, 'Gem': Gem, 'Diamond': Diamond,
  'Circle': Circle, 'Square': Square, 'Triangle': Triangle, 'Hexagon': Hexagon,
  'Octagon': Octagon, 'Pentagon': Pentagon, 'Award': Award, 'Medal': Medal,
  'Shield': Shield, 'Key': Key, 'Lock': Lock, 'Anchor': Anchor,
  'Compass': Compass, 'Map': Map, 'Globe': Globe, 'Mountain': Mountain,
  'Waves': Waves, 'Wind': Wind, 'Snowflake': Snowflake, 'Droplet': Droplet,
  'Sunrise': Sunrise, 'Sunset': Sunset
};

/**
 * Simple string hash function (djb2 algorithm)
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
const hashString = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
  }
  return Math.abs(hash);
};

/**
 * Generate a consistent random icon for a person based on their name
 * Uses the name as a seed to ensure the same person always gets the same icon
 * @param {string} name - Person's name or entity ID
 * @returns {React.Component} Lucide icon component
 */
export const getPersonIcon = (name) => {
  if (!name) return User;

  // Use djb2 hash algorithm for better distribution
  const hash = hashString(name.toLowerCase());
  const index = hash % PERSON_ICONS.length;

  return PERSON_ICONS[index];
};

/**
 * Get icon component by name
 * @param {string} iconName - Icon name (e.g., "Heart", "Star")
 * @returns {React.Component} Lucide icon component
 */
export const getIconByName = (iconName) => {
  return ICON_NAME_MAP[iconName] || User;
};

/**
 * Render a person icon with props
 * @param {string} name - Person's name
 * @param {object} props - Props to pass to the icon component
 * @param {string} customIcon - Optional custom icon name to use instead of random
 * @returns {JSX.Element} Icon component
 */
export const renderPersonIcon = (name, props = {}, customIcon = null) => {
  let IconComponent = customIcon ? getIconByName(customIcon) : getPersonIcon(name);

  // Fallback to User icon if invalid. 
  // In React 19/Lucide, components are often objects (ForwardRef), not functions.
  if (!IconComponent || (typeof IconComponent !== 'function' && typeof IconComponent !== 'object')) {
    IconComponent = User;
  }

  return <IconComponent {...props} />;
};

export default getPersonIcon;

