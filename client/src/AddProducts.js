import React, { useState, useEffect } from 'react'
import { useHistory } from "react-router-dom"
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SupplyChain.json"
import './AddProduct.css';

function AddProducts() {
    const history = useHistory()
    useEffect(() => {
        loadWeb3();
        loadBlockchaindata();
    }, [])

    const [currentaccount, setCurrentaccount] = useState("");
    const [loader, setloader] = useState(true);
    const [SupplyChain, setSupplyChain] = useState();
    const [products, setProducts] = useState();
    const [productName, setProductName] = useState();
    const [productDes, setProductDes] = useState();
    const [productStage, setProductStage] = useState();


    const loadWeb3 = async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert(
                "Non-Ethereum browser detected. You should consider trying MetaMask!"
            );
        }
    };

    const loadBlockchaindata = async () => {
        setloader(true);
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        setCurrentaccount(account);
        const networkId = await web3.eth.net.getId();
        const networkData = SupplyChainABI.networks[networkId];
        if (networkData) {
            const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
            setSupplyChain(supplychain);
            var i;
            const productCtr = await supplychain.methods.productCtr().call();
            const product = {};
            const stages = [];
            for (i = 0; i < productCtr; i++) {
                product[i] = await supplychain.methods.ProductStock(i + 1).call();
                stages[i] = await supplychain.methods.showStage(i + 1).call();
            }
            setProducts(product);
            setProductStage(stages);
            setloader(false);
        }
        else {
            window.alert('The smart contract is not deployed to current network')
        }
    }
    if (loader) {
        return (
            <div>
                <h1 className="wait">Loading...</h1>
            </div>
        )

    }
    const redirect_to_home = () => {
        history.push('/')
    }
    const handlerChangeProductName = (event) => {
        setProductName(event.target.value);
    }
    const handlerChangeProductDes = (event) => {
        setProductDes(event.target.value);
    }
    const handlerSubmitProduct = async (event) => {
        event.preventDefault();
        try {
            var reciept = await SupplyChain.methods.addProduct(productName, productDes).send({ from: currentaccount });
            if (reciept) {
                loadBlockchaindata();
            }
        }
        catch (err) {
            alert("An error occured!!!(Make sure you have entered the correct values and are an Owner)")
        }
    }
    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Place Order</h2>
                <button onClick={redirect_to_home} className="btn btn-outline-danger">Home</button>
            </div>
            <div className="alert alert-info">
                <strong>Current Account Address:</strong> {currentaccount}
            </div>

            <div className="row">
                <div className="col-12">
                    <h5>Add Product Order:</h5>
                    <form onSubmit={handlerSubmitProduct} className="form-inline mb-4">
                        <input 
                            className="form-control form-control-sm mr-2" 
                            type="text" 
                            onChange={handlerChangeProductName} 
                            placeholder="Product Name" 
                            required 
                        />
                        <input 
                            className="form-control form-control-sm mr-2" 
                            type="text" 
                            onChange={handlerChangeProductDes} 
                            placeholder="Product Description" 
                            required 
                        />
                        <button className="btn btn-outline-success btn-sm" type="submit">Order</button>
                    </form>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <h5>Ordered Products:</h5>
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead className="thead-light">
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Description</th>
                                    <th scope="col">Current Stage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(products).map(key => (
                                    <tr key={key}>
                                        <td>{products[key].id}</td>
                                        <td>{products[key].name}</td>
                                        <td>{products[key].description}</td>
                                        <td>{productStage[key]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddProducts;
