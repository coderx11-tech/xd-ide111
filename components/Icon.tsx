import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

const icons: { [key: string]: React.ReactNode } = {
  'folder-open': <path strokeLinecap="round" strokeLinejoin="round" d="M13 4.5a2.25 2.25 0 0 1 2.25 2.25v.54a.75.75 0 0 0 1.5 0v-.54a3.75 3.75 0 0 0-3.75-3.75h-3.75A3.75 3.75 0 0 0 5.25 6.75v8.5A2.25 2.25 0 0 0 7.5 17.5h9.375a2.25 2.25 0 0 0 2.25-2.25v-5.5a2.25 2.25 0 0 0-2.25-2.25h-5.625a2.25 2.25 0 0 1-2.25-2.25V4.5Z" />,
  'folder': <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 0 1 1.5 7.5V5.25A2.25 2.25 0 0 1 3.75 3h5.25a2.25 2.25 0 0 1 1.628.724l2.022 2.022a2.25 2.25 0 0 0 1.628.724h2.022a2.25 2.25 0 0 1 2.25 2.25v6.75a2.25 2.25 0 0 1-2.25-2.25H3.75a2.25 2.25 0 0 1-2.25-2.25V9.75Z" />,
  'file': <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />,
  'xylon': <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  'chevron-down': <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />,
  'chevron-right': <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />,
  'pencil': <path d="M17.25 4.343a1.5 1.5 0 0 0-2.121 0l-9.37 9.37a.374.374 0 0 0-.094.17l-1.5 4.5a.375.375 0 0 0 .44.44l4.5-1.5a.375.375 0 0 0 .17-.093l9.37-9.37a1.5 1.5 0 0 0 0-2.122Z M15 6.5l2.121 2.121" />,
  'trash': <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.226 2.077H8.064a2.25 2.25 0 0 1-2.226-2.077L4.477 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.265 0-.525.01-.784.028M5.25 5.79m14.456 0a48.108 48.108 0 0 1-3.478-.397m0 0a48.097 48.097 0 0 1-3.478-.397m-1.5 0c-.265 0-.525.01-.784.028m-6.49 0a48.118 48.118 0 0 1-3.478-.397m0 0a48.097 48.097 0 0 0-3.478-.397" />,
  'file-plus': <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5h6m-3-3v6M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />,
  'folder-plus': <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3h-6M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 0 1 1.5 7.5V5.25A2.25 2.25 0 0 1 3.75 3h5.25a2.25 2.25 0 0 1 1.628.724l2.022 2.022a2.25 2.25 0 0 0 1.628.724h2.022a2.25 2.25 0 0 1 2.25 2.25v6.75a2.25 2.25 0 0 1-2.25-2.25H3.75a2.25 2.25 0 0 1-2.25-2.25V9.75Z" />,
  'robot': <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15-3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m0 16.5v-1.5m-12-9.75h15M12 7.5a4.5 4.5 0 0 0-4.5 4.5 4.5 4.5 0 0 0 4.5 4.5 4.5 4.5 0 0 0 4.5-4.5 4.5 4.5 0 0 0-4.5-4.5Z" />,
  'sparkles': <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />,
  'wrench': <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.83-5.83m-3.58-3.58a.75.75 0 0 0-1.06 0l-4.12 4.12a.75.75 0 0 0 0 1.06l3.58 3.58a.75.75 0 0 0 1.06 0l4.12-4.12a.75.75 0 0 0 0-1.06l-3.58-3.58-3.58-3.58Zm0 0L8.25 7.5" />,
  'close': <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />,
  'send': <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L6 12Zm0 0h7.5" />,
  'play': <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />,
  'user': <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
  'download': <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />,
};

export const Icon: React.FC<IconProps> = ({ name, className }) => {
  return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
        className={className}
    >
      {icons[name]}
    </svg>
  );
};