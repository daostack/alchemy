import * as React from "react";
import { Link } from "react-router-dom";
import { ReactElement } from "react";

interface IDaoCustomInfo {
  [address: string]: ReactElement | string;
}

const data: IDaoCustomInfo = {
  "0x9003196e314e03dae65f0bf26788befc714d68a1": (
    <>
      <div>Welcome to The Venus Project DAO, a decentralized organization built on DAOstack.</div>
      <div>This is a DAO for the purpose of exploring new governance models and platforms for <a href="https://www.thevenusproject.com" target="_blank" rel="noopener noreferrer">The Venus Project</a>.</div>
      <div>Visit the <Link to={"/dao/0x9003196E314e03daE65f0bF26788befC714D68a1/schemes/"}>Proposals page</Link> to make a proposal to the DAO or vote on existing proposals.</div>
    </>
  ),
  "0xfaf05fedf06cac499b899d6a2052f23ae239b29d": (
    <>
      <div>Welcome to the SoS Collective digital co-op.</div>
      <div>Our first event is the <a href="https://soshackathon.com/" target="_blank" rel="noopener noreferrer">SoS Hackathon</a>: Fund your ideas and solutions to heal the world in crisis.</div>
      <ul>
        <li>Register for the hackathon <a href="https://bit.ly/GlobalSOSRegistration" target="_blank" rel="noopener noreferrer">here</a>.</li>
        <li>Create an onboarding proposal for the cooperative <Link to={"/dao/0xfaf05fedf06cac499b899d6a2052f23ae239b29d/scheme/0xd4b6ee901566c88f942c2a04803f65cb7a554d8bc9a8f4fb5ded5cd012ca0897/proposals/create/?beneficiary=&description=This%20is%20an%20introduction%20proposal%20to%20join%20the%20builder%20collective%20and%20SoS%20hackathon.%20Please%20fill%20out%20%3CYOUR%20NAME%3E,%20%3CLINK%20TO%20YOUR%20DISCORD%20ID%3E,%20%3CYOURSKILLS%3E,%20and%20%3CWHAT%20ARE%20YOU%20EXCITED%20ABOUT%3E&ethReward=0&externalTokenAddress=0x543ff227f64aa17ea132bf9886cab5db55dcaddf&externalTokenReward=0&nativeTokenReward=0&reputationReward=50&title=Onboarding%20:%20%3CYOUR%20NAME%3E&url=&tags=[]"}>here</Link>.</li>
        <li>Join our Discord community for fu,ther discussions here: <a href="https://discord.gg/rUr3rp7" target="_blank" rel="noopener noreferrer">https://discord.gg/rUr3rp7</a></li>
      </ul>
    </>
  ),
};

export default data;
