import {
    createContext,
    useContext,
    useState
}
from "react";


const LayoutContext = createContext();



export function LayoutProvider({children}){


    const [sidebarOpen,setSidebarOpen] = useState(false);



    function toggleSidebar(){

        setSidebarOpen(
            prev => !prev
        );

    }




    function closeSidebar(){

        setSidebarOpen(false);

    }




    return(

        <LayoutContext.Provider

        value={{

            sidebarOpen,

            toggleSidebar,

            closeSidebar

        }}

        >

            {children}

        </LayoutContext.Provider>

    );


}





export function useLayout(){

    return useContext(LayoutContext);

}