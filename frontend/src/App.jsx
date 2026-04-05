import { useState } from 'react'
import DownloadCard from './components/DownloadCard'
import LikedSongs from './components/LikedSongs'
import { Tabs, TabsContent } from './components/ui/tabs'

function App() {
  const [activeTab, setActiveTab] = useState('single')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            {/* <TabsList className="grid w-full max-w-md grid-cols-1"> */}
              {/* <TabsTrigger 
                value="single"
                data-state={activeTab === 'single' ? 'active' : 'inactive'}
              >
                Download 
              </TabsTrigger> */}
              {/* <TabsTrigger 
                value="liked"
                data-state={activeTab === 'liked' ? 'active' : 'inactive'}
              >
                Liked Songs
              </TabsTrigger> */}
            {/* </TabsList> */}
          </div>

     

          <TabsContent value="liked">
            <LikedSongs />
          </TabsContent>
               <TabsContent value="single" className="flex items-center justify-center">
            <DownloadCard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
