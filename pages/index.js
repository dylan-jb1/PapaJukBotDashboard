import React from 'react'
import MetaTags from 'react-meta-tags';

export default function Home({host}) {

    const [queryingResults, setQueryingResults] = React.useState(false);
    const [chatMessages, setChatMessages] = React.useState([]);
    const [startUpdateChat, setStartUpdateChat] = React.useState(undefined);
    const [botStatus, setBotStatus] = React.useState({bot: false, spotify: false, chat: false, response: false});
    const [spotifyInfo, setSpotifyInfo] = React.useState({username: "Unknown User", active_song: undefined, queueingEnabled: false});

    const botRef = React.useRef();
    const stateRef = React.useRef();
    stateRef.current = chatMessages;
    botRef.current = botStatus;

    async function getStatus() {
        return await fetch(host + '/health', {headers: {mode: 'no-cors'}})
            .then(response => response.json())
            .then(data => {return data})
            .catch(error => {return {bot: false, spotify: false, chat: false, response: false}});
    }

    async function updateSpotify() {
        if (botRef.current.spotify) {
            await fetch(host + '/spotify')
                .then(response => response.json())
                .then(data => {setSpotifyInfo(prev => data)})
                .catch(e => {console.log(e)});
        }
    }

    async function disableQueueing() {
        fetch(host + '/disableQueueing', {method: 'POST'}).then(response => {
            console.log(response)
        }).catch(e => {
            console.log(e)
        })
    }

    async function enableQueueing() {
        fetch(host + '/enableQueueing', {method: 'POST'}).then(response => {
            console.log(response)
        }).catch(e => {
            console.log(e)
        })
    }

    async function updateResults() {
        setQueryingResults(prev => true)
        await getStatus().then(
            response => {setBotStatus(prev => response); }
        )
        .catch(error => console.log(error))
        setQueryingResults(prev => false)
    }

    async function updateChat() {
        await fetch(host + '/chat')
            .then(response => response.json())
            .then(data => {setChatMessages(prev => [...stateRef.current, ...data.messages])})
            .catch(e => {console.log(e); stopUpdatingChat()});
    }

    React.useEffect(() => {
        setInterval(updateResults, 2000)
        setInterval(updateSpotify, 2000)
    }, [])

    function startUpdatingChat() {
        setStartUpdateChat(setInterval(updateChat, 1000));
    }

    function stopUpdatingChat() {
        clearInterval(startUpdateChat);
        setStartUpdateChat(undefined);
    }

    React.useEffect(() => {
        console.log(chatMessages)
    }, [chatMessages])

    return (
        <div className="containersDiv">
            <MetaTags>
            <title>Page 1</title>
                <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />
            </MetaTags>
            <div className="container">
                <h1>Bot Health</h1>
                <h3>Bot status</h3>
                {(queryingResults ? <p>Querying...</p> : (!botStatus ? <p className="text--yellow">Undefined</p> : (botStatus.bot ? <p className="text--green">Working</p> : <p className="text--red">Disabled</p>)))}
                <h3>Spotify Connected</h3>
                {(queryingResults ? <p>Querying...</p> : (!botStatus ? <p className="text--yellow">Undefined</p> : (botStatus.spotify ? <p className="text--green">Connected</p> : <p className="text--red">Not Connected</p>)))}
                <h3>Chat connection</h3>
                {(queryingResults ? <p>Querying...</p> : (!botStatus ? <p className="text--yellow">Undefined</p> : (botStatus.chat ? <p className="text--green">Connected</p> : <p className="text--red">Not Connected</p>)))}
                <h3>Can respond</h3>
                {(queryingResults ? <p>Querying...</p> : (!botStatus ? <p className="text--yellow">Undefined</p> : (botStatus.response ? <p className="text--green">Enabled</p> : <p className="text--red">Disabled</p>)))}
                <br/>
                <button onClick={updateResults} style={{width:150, height:50}}>Update</button>
            </div>
            <div className='container'>
                <h1>Chat</h1>
                {(() => {return botStatus.chat ? (
                <div className="chat">
                    <div className="messages">
                    {chatMessages.map(message => {
                        return (
                            <div className="chatMessage">
                                <div className="chatUser" style={{color:message.userColor}}>
                                    {message.user}
                                </div>
                                <div className="chatContent">
                                    {message.messageContent}
                                </div>
                                <div className="chatTimestamp">
                                    {message.timestamp}
                                </div>
                            </div>
                        )
                    })}
                    </div>
                    <div className="activateMonitorChat" onClick={startUpdateChat ? stopUpdatingChat : startUpdatingChat}>{(() => {return startUpdateChat ? "Stop updating chat" : "Start updating chat"})()}</div>
                </div>
                ) : <div className="noChat">No connection to chat...</div>})()}
            </div>
            {botStatus.spotify ? 
            <div className='container'>
                <h1>Spotify</h1>
                <h3>Current User</h3>
                <p>{spotifyInfo.username}</p>
                <h3>Currently Playing</h3>
                <iframe src={"https://open.spotify.com/embed/track/" + (spotifyInfo.active_song ? spotifyInfo.active_song : "1DFixLWuPkv3KT3TnVaaaa")} width="300" height="380" frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>
                <h3>User Queueing</h3>
                <div onClick={spotifyInfo.queueingEnabled ? disableQueueing : enableQueueing} className={"enableQueueButton " + (spotifyInfo.queueingEnabled ? "enableQueueButton--enabled" : "enableQueueButton--disabled")}>{spotifyInfo.queueingEnabled ? "Press to Disable Queueing" : "Press to Enable Queueing"}</div>
            </div>
            : <></>}
        </div>
    )
}

export async function getServerSideProps(context) {
    require("dotenv").config();
    
    return {
        props: {host: process.env.BOT_HOST}, // will be passed to the page component as props
    }
}
