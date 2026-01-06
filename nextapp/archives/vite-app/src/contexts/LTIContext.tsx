import React, { createContext, useContext, useState, useEffect } from 'react';
import { LTILaunchData, LTIService } from '../lib/lti';
import { setSecureItem, getSecureItem, removeSecureItem } from '../lib/secureStorage';

interface LTIContextType {
  isLTILaunch: boolean;
  launchData: LTILaunchData | null;
  resourceLinkId: string | null;
  contextId: string | null;
  isInstructor: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const LTIContext = createContext<LTIContextType>({
  isLTILaunch: false,
  launchData: null,
  resourceLinkId: null,
  contextId: null,
  isInstructor: false,
  isAdmin: false,
  loading: true
});

export const useLTI = () => useContext(LTIContext);

export const LTIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLTILaunch, setIsLTILaunch] = useState(false);
  const [launchData, setLaunchData] = useState<LTILaunchData | null>(null);
  const [resourceLinkId, setResourceLinkId] = useState<string | null>(null);
  const [contextId, setContextId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeLTI = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const idToken = urlParams.get('id_token');
        const state = urlParams.get('state');

        if (idToken) {
          const launch = await LTIService.validateLTILaunch(idToken);

          if (launch) {
            setIsLTILaunch(true);
            setLaunchData(launch);

            const userId = await LTIService.getOrCreateUserFromLTI(launch);

            if (userId && launch.context) {
              const ctxId = await LTIService.syncLTIContext(launch);
              setContextId(ctxId);

              if (ctxId && launch.resource_link) {
                const resLinkId = await LTIService.syncResourceLink(launch, ctxId);
                setResourceLinkId(resLinkId);
              }
            }

            await setSecureItem('lti_launch', launch);
            await setSecureItem('lti_resource_link_id', resourceLinkId || '');
          }
        } else {
          const storedLaunch = await getSecureItem<LTILaunchData>('lti_launch');
          const storedResourceLink = await getSecureItem<string>('lti_resource_link_id');

          if (storedLaunch) {
            setIsLTILaunch(true);
            setLaunchData(storedLaunch);
            setResourceLinkId(storedResourceLink || null);
          }
        }
      } catch (error) {
        console.error('Error initializing LTI:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeLTI();
  }, []);

  const isInstructor = launchData?.roles?.some(role =>
    role.toLowerCase().includes('instructor') ||
    role.toLowerCase().includes('teacher')
  ) || false;

  const isAdmin = launchData?.roles?.some(role =>
    role.toLowerCase().includes('administrator')
  ) || false;

  return (
    <LTIContext.Provider
      value={{
        isLTILaunch,
        launchData,
        resourceLinkId,
        contextId,
        isInstructor,
        isAdmin,
        loading
      }}
    >
      {children}
    </LTIContext.Provider>
  );
};
