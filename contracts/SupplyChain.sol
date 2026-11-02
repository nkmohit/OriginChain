// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract SupplyChain {
    //Smart Contract owner will be the person who deploys the contract only he can authorize various roles like retailer, Manufacturer,etc
    address public Owner;

    //note this constructor will be called when smart contract will be deployed on blockchain
    constructor() public {
        Owner = msg.sender;
    }

    //Roles (flow of an agricultural product supply chain)
    // RawMaterialSupplier; //This is where Manufacturer will get raw materials to make products
    // Manufacturer;  //Turns raw materials into finished products
    // Distributor; //This guy distributes the products to retailers
    // Retailer; //Normal customer buys from the retailer

    //modifier to make sure only the owner is using the function
    modifier onlyByOwner() {
        require(msg.sender == Owner);
        _;
    }

    //stages of a product in the supply chain
    enum STAGE {
        Init,
        RawMaterialSupply,
        Manufacture,
        Distribution,
        Retail,
        sold
    }
    //using this we are going to track every single product the owner orders

    //Product count
    uint256 public productCtr = 0;
    //Raw material supplier count
    uint256 public rmsCtr = 0;
    //Manufacturer count
    uint256 public manCtr = 0;
    //distributor count
    uint256 public disCtr = 0;
    //retailer count
    uint256 public retCtr = 0;

    //To store information about the product
    struct product {
        uint256 id; //unique product id
        string name; //name of the product
        string description; //about product
        uint256 RMSid; //id of the Raw Material supplier for this particular product
        uint256 MANid; //id of the Manufacturer for this particular product
        uint256 DISid; //id of the distributor for this particular product
        uint256 RETid; //id of the retailer for this particular product
        STAGE stage; //current product stage
    }

    //To store all the products on the blockchain
    mapping(uint256 => product) public ProductStock;

    //To show status to client applications
    function showStage(uint256 _productID)
        public
        view
        returns (string memory)
    {
        require(productCtr > 0);
        if (ProductStock[_productID].stage == STAGE.Init)
            return "Product Ordered";
        else if (ProductStock[_productID].stage == STAGE.RawMaterialSupply)
            return "Raw Material Supply Stage";
        else if (ProductStock[_productID].stage == STAGE.Manufacture)
            return "Manufacturing Stage";
        else if (ProductStock[_productID].stage == STAGE.Distribution)
            return "Distribution Stage";
        else if (ProductStock[_productID].stage == STAGE.Retail)
            return "Retail Stage";
        else if (ProductStock[_productID].stage == STAGE.sold)
            return "Product Sold";
    }

    //To store information about raw material supplier
    struct rawMaterialSupplier {
        address addr;
        uint256 id; //supplier id
        string name; //Name of the raw material supplier
        string place; //Place the raw material supplier is based in
    }

    //To store all the raw material suppliers on the blockchain
    mapping(uint256 => rawMaterialSupplier) public RMS;

    //To store information about manufacturer
    struct manufacturer {
        address addr;
        uint256 id; //manufacturer id
        string name; //Name of the manufacturer
        string place; //Place the manufacturer is based in
    }

    //To store all the manufacturers on the blockchain
    mapping(uint256 => manufacturer) public MAN;

    //To store information about distributor
    struct distributor {
        address addr;
        uint256 id; //distributor id
        string name; //Name of the distributor
        string place; //Place the distributor is based in
    }

    //To store all the distributors on the blockchain
    mapping(uint256 => distributor) public DIS;

    //To store information about retailer
    struct retailer {
        address addr;
        uint256 id; //retailer id
        string name; //Name of the retailer
        string place; //Place the retailer is based in
    }

    //To store all the retailers on the blockchain
    mapping(uint256 => retailer) public RET;

    //To add raw material suppliers. Only contract owner can add a new raw material supplier
    function addRMS(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        rmsCtr++;
        RMS[rmsCtr] = rawMaterialSupplier(_address, rmsCtr, _name, _place);
    }

    //To add manufacturer. Only contract owner can add a new manufacturer
    function addManufacturer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        manCtr++;
        MAN[manCtr] = manufacturer(_address, manCtr, _name, _place);
    }

    //To add distributor. Only contract owner can add a new distributor
    function addDistributor(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        disCtr++;
        DIS[disCtr] = distributor(_address, disCtr, _name, _place);
    }

    //To add retailer. Only contract owner can add a new retailer
    function addRetailer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        retCtr++;
        RET[retCtr] = retailer(_address, retCtr, _name, _place);
    }

    //To supply raw materials from RMS supplier to the manufacturer
    function RMSsupply(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findRMS(msg.sender);
        require(_id > 0);
        require(ProductStock[_productID].stage == STAGE.Init);
        ProductStock[_productID].RMSid = _id;
        ProductStock[_productID].stage = STAGE.RawMaterialSupply;
    }

    //To check if RMS is available in the blockchain
    function findRMS(address _address) private view returns (uint256) {
        require(rmsCtr > 0);
        for (uint256 i = 1; i <= rmsCtr; i++) {
            if (RMS[i].addr == _address) return RMS[i].id;
        }
        return 0;
    }

    //To manufacture product
    function Manufacturing(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findMAN(msg.sender);
        require(_id > 0);
        require(ProductStock[_productID].stage == STAGE.RawMaterialSupply);
        ProductStock[_productID].MANid = _id;
        ProductStock[_productID].stage = STAGE.Manufacture;
    }

    //To check if Manufacturer is available in the blockchain
    function findMAN(address _address) private view returns (uint256) {
        require(manCtr > 0);
        for (uint256 i = 1; i <= manCtr; i++) {
            if (MAN[i].addr == _address) return MAN[i].id;
        }
        return 0;
    }

    //To supply products from Manufacturer to distributor
    function Distribute(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findDIS(msg.sender);
        require(_id > 0);
        require(ProductStock[_productID].stage == STAGE.Manufacture);
        ProductStock[_productID].DISid = _id;
        ProductStock[_productID].stage = STAGE.Distribution;
    }

    //To check if distributor is available in the blockchain
    function findDIS(address _address) private view returns (uint256) {
        require(disCtr > 0);
        for (uint256 i = 1; i <= disCtr; i++) {
            if (DIS[i].addr == _address) return DIS[i].id;
        }
        return 0;
    }

    //To supply products from distributor to retailer
    function Retail(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findRET(msg.sender);
        require(_id > 0);
        require(ProductStock[_productID].stage == STAGE.Distribution);
        ProductStock[_productID].RETid = _id;
        ProductStock[_productID].stage = STAGE.Retail;
    }

    //To check if retailer is available in the blockchain
    function findRET(address _address) private view returns (uint256) {
        require(retCtr > 0);
        for (uint256 i = 1; i <= retCtr; i++) {
            if (RET[i].addr == _address) return RET[i].id;
        }
        return 0;
    }

    //To sell products from retailer to consumer
    function sold(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findRET(msg.sender);
        require(_id > 0);
        require(_id == ProductStock[_productID].RETid); //Only correct retailer can mark product as sold
        require(ProductStock[_productID].stage == STAGE.Retail);
        ProductStock[_productID].stage = STAGE.sold;
    }

    // To add new products to the stock
    function addProduct(string memory _name, string memory _description)
        public
        onlyByOwner()
    {
        require((rmsCtr > 0) && (manCtr > 0) && (disCtr > 0) && (retCtr > 0));
        productCtr++;
        ProductStock[productCtr] = product(
            productCtr,
            _name,
            _description,
            0,
            0,
            0,
            0,
            STAGE.Init
        );
    }
}
