# Validator Set Pallet 
For Substrate based chans using a hybrid PoW + PoA (GRANDPA) consensus. 

 Validator Set Pallet is designed to manage the set of GRANPA authorities operating under the SLA. [Session](https://github.com/paritytech/substrate/tree/master/frame/session) pallet is leveraged to ensure the rotation in the set. 
 [Im-Online](https://github.com/paritytech/substrate/tree/master/frame/im-online) pallet is integrated to control if everyone is online and rule out the off-line ones. 
 
 Once a new member headed in the validator set, the Session pallet takes over its keys. The Session pallet is going to wait until the next session begins (session length = 30 blocks) to put the validator in the queue, 
 which is going to last one more session to add it into the actual GRANDPA Authority list. This cycle is designed to ensure secure rotation in the set, and it always takes ~ 2 sessions. 
 
 ## Selection threshold
 There is a threshold for new validator to pass, which depends on the amount of P3D locked up for the collateral. It is required to prove block authirship in the time frame of N recent blocks back. Block authorship check is required to pass just once. 
 Hovewer, the collateral needs to remain locked up all the way through the node operating period. If the lock out period expires, the node is being moved from the validator set. In order to get back the threshold is required to pass again. 
 
 Options:

 - 100 000 P3D locked + 1 block authorship in 100 recent blocks back
 - 200 000 P3D locked + 1 block authorship in 2000 recent blocks back
 - 300 000 P3D locked + 1 blok authorship in 4000 recent blocks back
 - 400 000 P3D locked + 1 block authorship in 8000 recent blocks back

## Punishments
- Not being online/available: 20 000 P3D and get out the validator set
- Not being able to vote for any reason (Firewall, incorrect keys set up, etc.): 20 000 P3D and get out the validator set

## Comeback window
There is a "comeback window" a validator can rejoin the validator set after getting ruled out and witout a necessity of having yet a block mined.

- Ban period: 3 hours, since heading off the validator set
- Comeback window: 1 week, since the ban period got expired

