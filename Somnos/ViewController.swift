// UI
//      Light & face status tracking/notification (only need ui)
//      Confirmation of sound selection
//      Create animation for camera screen (low priority)
//Functionality
//      App runs in background
//      Fine tune values

import UIKit
import SideMenu
import SceneKit
import ARKit
import AVFoundation

//MARK: Sound
public var selectedSound = "bleep"
public var player: AVAudioPlayer?

public func playSound() {
    guard let url = Bundle.main.url(forResource: selectedSound, withExtension: "mp3") else { return }
    
    do {
        try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
        try AVAudioSession.sharedInstance().setActive(true)
        
        player = try AVAudioPlayer(contentsOf: url, fileTypeHint: AVFileType.mp3.rawValue)
        
        guard let player = player else { return }
        player.numberOfLoops = 2
        player.setVolume(75, fadeDuration: 1)
        
        player.play()
        
    } catch let error {
        print(error.localizedDescription)
    }
}

class ViewController: UIViewController, ARSCNViewDelegate, MenuListControllerDelegate {
        
    //menu variables
    var menu: SideMenuNavigationController?
    let changeRingtoneViewController = ChangeRingtoneViewController()
    let aboutViewController = AboutViewController()
    @IBOutlet weak var barButton: UIBarButtonItem!

    //declaring view & variables
    @IBOutlet var sceneView: ARSCNView!
    @IBOutlet weak var driveStartButton: UIButton!
    
    //blink detection variables
    var timestamp = NSDate().timeIntervalSince1970
    var queue: [Double] = []
    var analysis = ""
    var blink = false
    var acct: Float = 0.0
    
    //light status variables
    var light = true
    var onCooldown = false
    
    //timer variables
    @IBOutlet weak var timerLabel: UILabel!
    var timer = Timer()
    var count = 0
    var timerCounting = false
    
    //constants
    let threshold: Float = 10
    
    // MARK: Debuggers (Remove)
    @IBOutlet weak var testLabel: UILabel!
    
    
    // MARK: Button Actions
    
    private func addChildControllers() {
        addChild(changeRingtoneViewController)
        addChild(aboutViewController)
        
        view.addSubview(changeRingtoneViewController.view)
        view.addSubview(aboutViewController.view)
        
        changeRingtoneViewController.view.frame = view.bounds
        aboutViewController.view.frame = view.bounds
        
        changeRingtoneViewController.didMove(toParent: self)
        aboutViewController.didMove(toParent: self)
        
        changeRingtoneViewController.view.isHidden = true
        aboutViewController.view.isHidden = true
    }
    
    @IBAction func didTapMenu(){
        present(menu!, animated: true)
    }
    
    func didSelectItem(named: String) {
        menu?.dismiss(animated: true, completion: {
            
            self.title = named
            
            if named == "Home"{
                self.changeRingtoneViewController.view.isHidden = true
                self.aboutViewController.view.isHidden = true
                
            }else if named == "Change Ringtone" {
                self.changeRingtoneViewController.view.isHidden = false
                self.aboutViewController.view.isHidden = true
                
            } else if named == "About Somnos" {
                self.aboutViewController.view.isHidden = false
                self.changeRingtoneViewController.view.isHidden = true
            }
            
        })
        
    }
    
    @IBAction func driveButtonTapped(_ sender: Any) {
        if(timerCounting)
        {
            timerLabel.isHidden = true
            timerLabel.text = "00 : 00 : 00"
            timerCounting = false
            timer.invalidate()
            count = 0
            driveStartButton.setTitle("START", for: .normal)
        }
        else
        {
            count = 0
            timerLabel.isHidden = false
            timerCounting = true
            driveStartButton.setTitle("STOP", for: .normal)
            timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true, block: { _ in
                self.updateTimer()
            })
        }
    }
    
    //MARK: viewDidLoad
    override func viewDidLoad() {
        super.viewDidLoad()
        
        sceneView.delegate = self
        guard ARFaceTrackingConfiguration.isSupported else {
            fatalError("Face tracking is not supported on this device.")
            
        }
        
        timerLabel.text = "00 : 00 : 00"
        timerLabel.isHidden = true
        
        driveStartButton.layer.cornerRadius = 50
        driveStartButton.layer.masksToBounds = true
        driveStartButton.clipsToBounds = true
        
        let sideMenu = MenuListController(with: ["Home",
                                                 "Change Ringtone",
                                                 "About Somnos"])
        sideMenu.delegate = self
        
        menu = SideMenuNavigationController(rootViewController: sideMenu)
        menu?.leftSide = true
        menu?.setNavigationBarHidden(true, animated: false)
        SideMenuManager.default.leftMenuNavigationController = menu
        SideMenuManager.default.addPanGestureToPresent(toView: self.view)
        addChildControllers()
        
        navigationController?.navigationBar.barTintColor = UIColor(red: 78/225.0, green: 128/225.0, blue: 185/225.0, alpha: 1)
        
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Create a session configuration
        let configuration = ARFaceTrackingConfiguration()
        configuration.isLightEstimationEnabled = true
        
        // Run the view's session
        sceneView.session.run(configuration)
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        
        // Pause the view's session
        sceneView.session.pause()
    }
    
    // MARK: - ARSCNViewDelegate
    
    //Creates wireframe
    func renderer(_ renderer: SCNSceneRenderer, nodeFor anchor: ARAnchor) -> SCNNode? {
        let faceMesh = ARSCNFaceGeometry(device: sceneView.device!)
        let node = SCNNode(geometry: faceMesh)
        node.geometry?.firstMaterial?.fillMode = .lines
        return node
    }
    
    //Updates wireframe
    func renderer(_ renderer: SCNSceneRenderer, didUpdate node: SCNNode, for anchor: ARAnchor) {
        if let faceAnchor = anchor as? ARFaceAnchor, let faceGeometry = node.geometry as? ARSCNFaceGeometry {
            faceGeometry.update(from: faceAnchor.geometry)
            expression(anchor: faceAnchor)
        }
    }
    
    // MARK: - Blink Check Function
    func expression(anchor: ARFaceAnchor) {
        //print(checkFaceStatus(anchor: anchor))
        let blinkRight = anchor.blendShapes[.eyeBlinkLeft]
        let blinkLeft = anchor.blendShapes[.eyeBlinkRight]
        let Lval = Double(truncating: blinkLeft ?? 0.0)
        let Rval = Double(truncating: blinkRight ?? 0.0)
        self.analysis = "Left blink = \(round(Lval*10)/10.0) & Right blink = \(round(Rval*10)/10.0)\nAcct = \(acct)\nArray = \(queue)"
        
        //blink check
        if (((blinkLeft?.decimalValue ?? 0.0 > 0.75) && (blinkRight?.decimalValue ?? 0.0 > 0.75)) && !blink){
            blink = true
            
            let newtimestamp = NSDate().timeIntervalSince1970
            let timestampDifference = abs(newtimestamp - timestamp)
            acct += Float(timestampDifference)
            timestamp = newtimestamp
            queue.append(timestampDifference)
            
            self.analysis += "\(queue[0])"
            
            //dump(queue)
            print("Acct\(acct)")
            
            //add wait maybe
            if (queue.count > 30){
                queue.remove(at: 0)
                if (acct > threshold){
                    acct = 0.0
                    statistics()
                }
            }
            
        } else if (blinkLeft?.decimalValue ?? 0.0 < 0.75) && (blinkRight?.decimalValue ?? 0.0 < 0.75) {
            blink = false
        }
        
    }
    
    // MARK: Statistics Function
    func statistics () {
        let x = 60 * 30 / queue.avg();
        print(queue.avg())
        if(x < 10.2){
            //sleepy (maybe have a temperary popup for now)
            print("You are sleepy")
            playSound()
        }
        if(x > 15){
            //they need to see a doctor
            print("Seek a doctor")
        }
    }
    
    //MARK: Light & Face Status Function
    func checkFaceStatus (anchor: ARFaceAnchor) /* -> String */ {
        //var status = ""
        // move the light estimation to another
        let frame = sceneView.session.currentFrame
        let lightEstimate = Int (frame?.lightEstimate?.ambientIntensity ?? 0)
        //print("Lightestimate:\(lightEstimate)")
        
        if (lightEstimate < 50) {
            //print("Lighting is too dark")
            light = false
        } else {
            light = true
        }
        
        /*if (!light && !onCooldown){
            onCooldown = true
            let seconds = 2.5
            DispatchQueue.main.asyncAfter(deadline: .now() + seconds) {
                if (!self.light){
                    print("It's too dark")
                    playSound()
                }
                self.onCooldown = false
            }*/
        
        if (!onCooldown){
            onCooldown = true
            let seconds = 2.5
            DispatchQueue.main.asyncAfter(deadline: .now() + seconds) {
                print("a");
                print(self.light)
                playSound()
                print(light)
                print(onCooldown)
                print(self.onCooldown)
                if (!self.light){
                    print("It's too dark")
                    playSound()
                }
                if (!anchor.isTracked) {
                    print("reposition")
                    playSound()
                }
                self.onCooldown = false
            }
        }
        
        //status = anchor.isTracked ? "Tracking working" : "Reposition"
        //return status
    }
    
    
    
    @objc func updateTimer() {
        count = count + 1
        let time = secondsToHoursMinutesSeconds(seconds: count)
        let timeString = makeTimeString(hours: time.0, minutes: time.1, seconds: time.2)
        timerLabel.text = timeString
    }
    
    func secondsToHoursMinutesSeconds(seconds: Int) -> (Int, Int, Int) {
        return ((seconds / 3600), ((seconds % 3600) / 60),((seconds % 3600) % 60))
    }
    
    func makeTimeString(hours: Int, minutes: Int, seconds : Int) -> String  {
        var timeString = ""
        timeString += String(format: "%02d", hours)
        timeString += " : "
        timeString += String(format: "%02d", minutes)
        timeString += " : "
        timeString += String(format: "%02d", seconds)
        return timeString
    }
}

//MARK: Extensions
extension Array where Element: FloatingPoint {
    
    func sum() -> Element {
        return self.reduce(0, +)
    }
    
    func avg() -> Element {
        return self.sum() / Element(self.count)
    }
    
    func std() -> Element {
        let mean = self.avg()
        let v = self.reduce(0, { $0 + ($1-mean)*($1-mean) })
        return sqrt(v / (Element(self.count) - 1))
    }
}

//MARK: Menu

protocol MenuListControllerDelegate {
    func didSelectItem(named: String)
}

class MenuListController: UITableViewController{
    
    public var delegate: MenuListControllerDelegate?
    
    var items = ["Home", "Change Ringtone", "About Somnos"]
    let backgroundColor = UIColor(red: 78/225.0, green: 128/225.0, blue: 185/225.0, alpha: 1)
    
    init(with items: [String]) {
        self.items = items
        super.init(nibName: nil, bundle: nil)
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell ")
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        tableView.backgroundColor = backgroundColor
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell")
    }
    
    override func tableView(_ tableview: UITableView, numberOfRowsInSection section: Int) -> Int {
        return items.count
    }
    
    override func tableView (_ tableview: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableview.dequeueReusableCell(withIdentifier: "cell", for: indexPath)
        cell.textLabel?.text = items[indexPath.row]
        cell.textLabel?.textColor = .white
        cell.backgroundColor = backgroundColor
        tableView.backgroundColor = backgroundColor
        return cell
    }
    
    override func tableView(_ tableview: UITableView, didSelectRowAt indexPath: IndexPath){
        tableView.deselectRow(at: indexPath, animated: true)
        //Relay to delegate about menu item selection
        let selectedItem = items[indexPath.row]
        delegate?.didSelectItem(named: selectedItem)
    }
    
}
